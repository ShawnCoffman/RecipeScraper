// Shared recipe logic: extraction, scaling and text formatting.
// Loaded by popup.html (scaling + formatting), injected into the active tab by popup.js
// (extraction), and required directly by the Node tests in /test.
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------

  const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    ndash: '–', mdash: '—', deg: '°', frac12: '½',
    frac14: '¼', frac34: '¾', hellip: '…'
  };

  // Strip HTML tags and decode entities. Block-level breaks become newlines.
  function cleanText(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, entity) => {
        if (entity[0] === '#') {
          const code = entity[1].toLowerCase() === 'x'
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
          return Number.isFinite(code) && code <= 0x10FFFF ? String.fromCodePoint(code) : match;
        }
        const named = NAMED_ENTITIES[entity.toLowerCase()];
        return named !== undefined ? named : match;
      })
      .replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .trim();
  }

  function collapseWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  // Convert ISO 8601 duration (PT10M) to readable format (10 minutes)
  function parseDuration(duration) {
    if (!duration || typeof duration !== 'string' || !duration.startsWith('P')) {
      return duration;
    }

    const parts = duration.substring(1).split('T');
    let days = 0, hours = 0, minutes = 0, seconds = 0;

    if (parts[0]) {
      const dayMatch = parts[0].match(/(\d+)D/);
      if (dayMatch) days = parseInt(dayMatch[1], 10);
    }
    if (parts[1]) {
      const hourMatch = parts[1].match(/(\d+)H/);
      const minMatch = parts[1].match(/(\d+)M/);
      const secMatch = parts[1].match(/(\d+)S/);
      if (hourMatch) hours = parseInt(hourMatch[1], 10);
      if (minMatch) minutes = parseInt(minMatch[1], 10);
      if (secMatch) seconds = parseInt(secMatch[1], 10);
    }

    const result = [];
    if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) result.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

    return result.length > 0 ? result.join(' ') : duration;
  }

  // ---------------------------------------------------------------------------
  // Extraction: Schema.org JSON-LD, with an HTML fallback
  // ---------------------------------------------------------------------------

  // @type may be a string or a list, and may carry a prefix: "Recipe", "schema:Recipe",
  // "http://schema.org/Recipe".
  function hasType(node, name) {
    if (!node || typeof node !== 'object') return false;
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return types.some(type => typeof type === 'string' && type.replace(/^.*[/:#]/, '') === name);
  }

  function isRecipeSchema(data) {
    return hasType(data, 'Recipe');
  }

  const MAX_SCHEMA_DEPTH = 10;

  // Walk the whole JSON-LD tree (@graph, mainEntity, ItemList entries, ...), collecting
  // every Recipe node. A Recipe's own children aren't searched.
  function collectRecipes(node, found, depth = 0) {
    if (!node || typeof node !== 'object' || depth > MAX_SCHEMA_DEPTH) return found;
    if (Array.isArray(node)) {
      node.forEach(item => collectRecipes(item, found, depth + 1));
      return found;
    }
    if (isRecipeSchema(node)) {
      found.push(node);
      return found;
    }
    Object.values(node).forEach(value => collectRecipes(value, found, depth + 1));
    return found;
  }

  // Pages often repeat the same recipe in several JSON-LD blocks; keep one of each.
  function dedupeRecipes(recipes) {
    const seen = new Set();
    return recipes.filter(recipe => {
      const key = JSON.stringify([recipe.name, recipe.recipeIngredient]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function extractRecipeSchema(doc) {
    const recipes = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        collectRecipes(JSON.parse(script.textContent), recipes);
      } catch (e) {
        // Skip invalid JSON
      }
    });
    return dedupeRecipes(recipes);
  }

  const INGREDIENT_CLASS = /ingredient/i;
  const INSTRUCTION_CLASS = /(^|[\s_-])(instructions?|directions?|method|steps?)($|[\s_-])/i;

  // Elements whose class matches `pattern`, keeping only the innermost of nested matches.
  function findSections(doc, pattern) {
    const candidates = Array.from(doc.querySelectorAll('[class]'))
      .filter(el => pattern.test(el.getAttribute('class') || ''));
    return candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
  }

  function bestList(sections, selector, minLength) {
    return sections
      .map(section => Array.from(section.querySelectorAll(selector))
        .map(el => collapseWhitespace(el.textContent))
        .filter(text => text.length >= minLength))
      .reduce((best, current) => (current.length > best.length ? current : best), []);
  }

  // A page only counts as a recipe if it has a real ingredient list and some instructions.
  function extractRecipeFallback(doc) {
    const ingredients = bestList(findSections(doc, INGREDIENT_CLASS), 'li', 1);
    const instructions = bestList(findSections(doc, INSTRUCTION_CLASS), 'li, p', 11);
    if (ingredients.length < 3 || instructions.length < 2) return null;

    const recipe = { recipeIngredient: ingredients, recipeInstructions: instructions };
    const title = doc.querySelector('h1');
    if (title) recipe.name = collapseWhitespace(title.textContent);
    return recipe;
  }

  // Raw recipe data only; formatting and scaling happen in the popup.
  function extractRecipes(doc) {
    doc = doc || root.document;
    let recipes = extractRecipeSchema(doc);
    if (recipes.length === 0) {
      const fallback = extractRecipeFallback(doc);
      if (fallback) recipes = [fallback];
    }

    if (recipes.length === 0) {
      return { success: false, noRecipe: true, error: 'No recipe found on this page' };
    }
    return { success: true, recipes, url: doc.location ? doc.location.href : null };
  }

  // ---------------------------------------------------------------------------
  // Scaling
  // ---------------------------------------------------------------------------

  const UNICODE_FRACTIONS = {
    '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4,
    '⅐': 1 / 7, '⅑': 1 / 9, '⅒': 1 / 10,
    '⅓': 1 / 3, '⅔': 2 / 3,
    '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5,
    '⅙': 1 / 6, '⅚': 5 / 6,
    '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8
  };
  const FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join('');

  // Read a number from the start of `text`: "2", "1.5", "1/2", "1 1/2", "2½", "2 ½", "½".
  // Returns { value, length } or null.
  function readNumber(text) {
    let m = text.match(new RegExp(`^(\\d+)\\s*([${FRACTION_CHARS}])`));
    if (m) return { value: Number(m[1]) + UNICODE_FRACTIONS[m[2]], length: m[0].length };

    m = text.match(new RegExp(`^([${FRACTION_CHARS}])`));
    if (m) return { value: UNICODE_FRACTIONS[m[1]], length: m[0].length };

    // "1-1/2" is how many US sites write one and a half, not a range
    m = text.match(/^(\d+)-(\d+)\/(\d+)/);
    if (m && Number(m[2]) < Number(m[3])) return { value: Number(m[1]) + Number(m[2]) / Number(m[3]), length: m[0].length };

    m = text.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (m && Number(m[3]) !== 0) return { value: Number(m[1]) + Number(m[2]) / Number(m[3]), length: m[0].length };

    m = text.match(/^(\d+)\/(\d+)/);
    if (m && Number(m[2]) !== 0) return { value: Number(m[1]) / Number(m[2]), length: m[0].length };

    m = text.match(/^(\d*\.\d+|\d+)/);
    if (m) return { value: Number(m[1]), length: m[0].length };

    return null;
  }

  // Preferred printed fractions, with the decimal each one stands for.
  const FRACTION_STEPS = [
    [0, ''], [1 / 16, '1/16'], [1 / 8, '⅛'], [1 / 6, '⅙'], [1 / 4, '¼'],
    [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'],
    [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']
  ];

  // Print a quantity the way a cook would write it: 2.5 -> "2 ½", 0.3333 -> "⅓".
  function formatQuantity(value) {
    if (!(value > 0)) return '0';

    const whole = Math.floor(value);
    const frac = value - whole;
    const [stepValue, symbol] = FRACTION_STEPS.reduce((best, step) =>
      Math.abs(step[0] - frac) < Math.abs(best[0] - frac) ? step : best
    );

    if (Math.abs(stepValue - frac) > 0.02) {
      return String(Math.round(value * 100) / 100); // no tidy fraction; use up to 2 decimals
    }
    if (stepValue === 1) return String(whole + 1);
    if (stepValue === 0) return String(whole);
    return whole > 0 ? `${whole} ${symbol}` : symbol;
  }

  const RANGE_SEPARATOR = /^\s*(?:-|–|—|to)\s*(?=[\d.¼-¾⅐-⅞])/i;
  const NON_QUANTITY_HINT = /to taste|as needed|for (?:serving|garnish|dusting|greasing)|\b(?:pinch|dash)\b/i;
  const EGG_UNIT = /^\s*(?:(?:extra[- ]large|large|medium|small)\s+)?eggs?\b/i;

  // Scale the leading quantity of an ingredient line. Only the first number (or range)
  // changes, so "1 (14 oz) can tomatoes" doubles to "2 (14 oz) can tomatoes".
  function scaleIngredient(ingredient, scale) {
    const text = String(ingredient).trim();
    const unchanged = warning => ({ original: ingredient, scaled: text, changed: false, warning });

    const first = readNumber(text);
    if (!first) {
      return unchanged(NON_QUANTITY_HINT.test(text) ? 'Adjust to taste' : null);
    }

    let rest = text.slice(first.length);
    // "2-inch piece" describes a size, not a quantity
    if (/^-[a-z]/i.test(rest)) return unchanged(null);

    let low = first.value;
    let high = null;
    const separator = rest.match(RANGE_SEPARATOR);
    if (separator) {
      const second = readNumber(rest.slice(separator[0].length));
      if (second) {
        high = second.value;
        rest = rest.slice(separator[0].length + second.length);
      }
    }

    let warning = null;
    let scaledText;

    if (high === null && EGG_UNIT.test(rest)) {
      const exact = low * scale;
      const rounded = Math.round(exact * 2) / 2; // eggs come in whole or half amounts
      if (rounded % 1 === 0.5) {
        warning = `${Math.floor(rounded)} large + 1 white, or ${Math.ceil(rounded)} small`;
      }
      scaledText = formatQuantity(rounded);
    } else if (high === null) {
      scaledText = formatQuantity(low * scale);
    } else {
      scaledText = `${formatQuantity(low * scale)}-${formatQuantity(high * scale)}`;
    }

    return {
      original: ingredient,
      scaled: scaledText + rest,
      changed: scale !== 1,
      warning
    };
  }

  // Scale the first number (or range) in a yield such as "4 servings" or "4-6 servings".
  // Yields can also be numbers.
  function scaleYield(yieldInfo, scale) {
    if (Array.isArray(yieldInfo)) yieldInfo = yieldInfo[0];
    const text = String(yieldInfo);
    const start = text.search(/\.?\d/);
    if (start === -1) return text;

    const first = readNumber(text.slice(start));
    let end = start + first.length;
    // "8-inch pie" describes a size, not a quantity
    if (/^-[a-z]/i.test(text.slice(end))) return text;

    let scaledText = formatQuantity(first.value * scale);
    const separator = text.slice(end).match(RANGE_SEPARATOR);
    if (separator) {
      const second = readNumber(text.slice(end + separator[0].length));
      if (second) {
        scaledText += separator[0] + formatQuantity(second.value * scale);
        end += separator[0].length + second.length;
      }
    }
    return text.slice(0, start) + scaledText + text.slice(end);
  }

  const SCALE_LABELS = { 0.5: 'Half', 1: 'Original', 2: 'Double', 3: 'Triple' };

  function scaleLabel(scale) {
    return SCALE_LABELS[scale] || `${scale}×`;
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  function authorName(author) {
    if (!author) return null;
    if (Array.isArray(author)) {
      const names = author.map(authorName).filter(Boolean);
      return names.length > 0 ? names.join(', ') : null;
    }
    if (typeof author === 'string') return cleanText(author);
    return author.name ? cleanText(author.name) : null;
  }

  // Normalize recipeInstructions (string, steps, sections) into
  // [{ heading } | { step }] entries.
  function instructionLines(instructions) {
    const lines = [];

    function addText(text) {
      cleanText(text).split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed) lines.push({ step: trimmed });
      });
    }

    function walk(node) {
      if (!node) return;
      if (typeof node === 'string') {
        addText(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (typeof node === 'object') {
        if (hasType(node, 'HowToSection')) {
          if (node.name) lines.push({ heading: cleanText(node.name) });
          walk(node.itemListElement);
        } else if (node.text || node.name) {
          addText(node.text || node.name);
        }
      }
    }

    walk(instructions);
    return lines;
  }

  function ingredientList(recipeData) {
    const raw = recipeData.recipeIngredient || [];
    return (Array.isArray(raw) ? raw : [raw]).map(item => cleanText(String(item)));
  }

  const RULE_WIDTH = 60;

  // Plain-text version of a recipe, used for the popup, Copy and Download.
  function formatRecipe(recipeData, options) {
    if (!recipeData) return null;
    const { scale = 1, sourceUrl = null } = options || {};
    const scaled = scale !== 1;

    const output = [];
    output.push('='.repeat(RULE_WIDTH));
    output.push(`RECIPE: ${cleanText(recipeData.name) || 'Unknown Recipe'}`);
    output.push('='.repeat(RULE_WIDTH));

    if (recipeData.description) {
      output.push('');
      output.push(cleanText(recipeData.description));
      output.push('');
    }

    const author = authorName(recipeData.author);
    if (author) output.push(`By: ${author}`);
    if (sourceUrl) output.push(`Source: ${sourceUrl}`);
    if (scaled) output.push(`Scale: ${scaleLabel(scale)}`);

    if (recipeData.prepTime) output.push(`Prep Time: ${parseDuration(recipeData.prepTime)}`);
    if (recipeData.cookTime) output.push(`Cook Time: ${parseDuration(recipeData.cookTime)}`);
    if (recipeData.totalTime) output.push(`Total Time: ${parseDuration(recipeData.totalTime)}`);
    if (recipeData.recipeYield) {
      const yieldText = scaled
        ? scaleYield(recipeData.recipeYield, scale)
        : String(Array.isArray(recipeData.recipeYield) ? recipeData.recipeYield[0] : recipeData.recipeYield);
      output.push(`Servings: ${yieldText}`);
    }

    output.push('');
    output.push('-'.repeat(RULE_WIDTH));
    output.push('INGREDIENTS:');
    output.push('-'.repeat(RULE_WIDTH));
    ingredientList(recipeData).forEach((ingredient, i) => {
      if (!scaled) {
        output.push(`${i + 1}. ${ingredient}`);
        return;
      }
      const item = scaleIngredient(ingredient, scale);
      let line = `${i + 1}. ${item.scaled}`;
      if (item.warning) line += ` (${item.warning})`;
      if (item.changed) line += ` (was: ${item.original})`;
      output.push(line);
    });

    output.push('');
    output.push('-'.repeat(RULE_WIDTH));
    output.push(scaled ? 'INSTRUCTIONS (unchanged):' : 'INSTRUCTIONS:');
    output.push('-'.repeat(RULE_WIDTH));
    let stepNum = 1;
    instructionLines(recipeData.recipeInstructions).forEach(line => {
      if (line.heading) {
        output.push('');
        output.push(`${line.heading}:`);
      } else {
        output.push(`${stepNum}. ${line.step}`);
        stepNum++;
      }
    });

    output.push('');
    output.push('='.repeat(RULE_WIDTH));
    return output.join('\n');
  }

  const api = {
    extractRecipes,
    extractRecipeSchema,
    extractRecipeFallback,
    formatRecipe,
    instructionLines,
    ingredientList,
    scaleIngredient,
    scaleYield,
    scaleLabel,
    formatQuantity,
    parseDuration,
    cleanText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.RecipeScraper = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
