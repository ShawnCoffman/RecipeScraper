const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  extractRecipes,
  extractRecipeSchema,
  formatRecipe,
  scaleIngredient,
  scaleYield,
  formatQuantity,
  parseDuration,
  cleanText
} = require('../browser-extension/recipe.js');

function pageWith(body, head = '') {
  const html = `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
  return new JSDOM(html, { url: 'https://example.com/recipes/pancakes' }).window.document;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

const pancakes = {
  '@type': 'Recipe',
  name: 'Pancakes &amp; Syrup',
  description: 'Fluffy &amp; quick.',
  author: { '@type': 'Person', name: 'Jane Cook' },
  prepTime: 'PT10M',
  cookTime: 'PT1H30M',
  recipeYield: ['4', '4 servings'],
  recipeIngredient: ['1 cup flour', '1 egg', '1 cup milk'],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Mix the dry ingredients.' },
    { '@type': 'HowToStep', text: 'Add <b>wet</b> ingredients.' }
  ]
};

const scaled = (text, factor) => scaleIngredient(text, factor).scaled;

describe('parseDuration', () => {
  test('formats hours and minutes', () => {
    assert.equal(parseDuration('PT1H30M'), '1 hour 30 minutes');
  });
  test('handles days and singular units', () => {
    assert.equal(parseDuration('P1DT1M'), '1 day 1 minute');
  });
  test('passes through non-ISO values', () => {
    assert.equal(parseDuration('about 5 min'), 'about 5 min');
  });
});

describe('cleanText', () => {
  test('decodes named and numeric entities', () => {
    assert.equal(cleanText('Tom &amp; Jerry&#39;s &#x2013; &deg;F'), "Tom & Jerry's – °F");
  });
  test('strips tags but keeps literal angle brackets that were escaped', () => {
    assert.equal(cleanText('<p>Bake at &lt;350&gt;</p>'), 'Bake at <350>');
  });
  test('leaves out-of-range numeric entities alone instead of throwing', () => {
    assert.equal(cleanText('a &#99999999; b'), 'a &#99999999; b');
  });
});

describe('schema extraction', () => {
  test('reads a single Recipe object', () => {
    const result = extractRecipes(pageWith('', jsonLd(pancakes)));
    assert.equal(result.success, true);
    assert.equal(result.recipes.length, 1);
    assert.equal(result.url, 'https://example.com/recipes/pancakes');
  });

  test('finds a Recipe inside @graph', () => {
    const doc = pageWith('', jsonLd({ '@graph': [{ '@type': 'WebSite' }, pancakes] }));
    assert.equal(extractRecipeSchema(doc).length, 1);
  });

  test('finds a Recipe inside a top-level array containing @graph', () => {
    const doc = pageWith('', jsonLd([{ '@type': 'WebSite' }, { '@graph': [pancakes] }]));
    assert.equal(extractRecipeSchema(doc).length, 1);
  });

  test('accepts @type given as an array', () => {
    const doc = pageWith('', jsonLd({ ...pancakes, '@type': ['Recipe', 'Thing'] }));
    assert.equal(extractRecipeSchema(doc).length, 1);
  });

  test('accepts prefixed @type values', () => {
    const doc = pageWith('', jsonLd({ ...pancakes, '@type': 'http://schema.org/Recipe' })
      + jsonLd({ ...pancakes, name: 'Waffles', '@type': 'schema:Recipe' }));
    assert.equal(extractRecipeSchema(doc).length, 2);
  });

  test('finds a Recipe under mainEntity or in an ItemList', () => {
    const page = { '@type': 'WebPage', mainEntity: pancakes };
    assert.equal(extractRecipeSchema(pageWith('', jsonLd(page))).length, 1);
    const list = { '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', item: pancakes }] };
    assert.equal(extractRecipeSchema(pageWith('', jsonLd(list))).length, 1);
  });

  test('returns every distinct recipe so the popup can offer a choice', () => {
    const other = { ...pancakes, name: 'Waffles', recipeIngredient: ['2 cups flour'] };
    const doc = pageWith('', jsonLd(pancakes) + jsonLd(other));
    assert.equal(extractRecipes(doc).recipes.length, 2);
  });

  test('collapses the same recipe repeated in several JSON-LD blocks', () => {
    const doc = pageWith('', jsonLd(pancakes) + jsonLd({ '@graph': [pancakes] }));
    assert.equal(extractRecipes(doc).recipes.length, 1);
  });

  test('skips invalid JSON-LD blocks', () => {
    const doc = pageWith('', '<script type="application/ld+json">{oops</script>' + jsonLd(pancakes));
    assert.equal(extractRecipeSchema(doc).length, 1);
  });
});

describe('HTML fallback', () => {
  const soup = `
    <h1>  Grandma's   Soup </h1>
    <ul class="recipe-ingredients">
      <li>2 carrots,
          chopped</li>
      <li>1 onion</li>
      <li>4 cups stock</li>
    </ul>
    <ol class="instructions">
      <li>Chop everything finely.</li>
      <li>Simmer for an hour.</li>
    </ol>`;

  test('extracts a recipe from class-named lists', () => {
    const result = extractRecipes(pageWith(soup));
    assert.equal(result.success, true);
    const [recipe] = result.recipes;
    assert.equal(recipe.name, "Grandma's Soup");
    assert.deepEqual(recipe.recipeIngredient, ['2 carrots, chopped', '1 onion', '4 cups stock']);
    assert.equal(recipe.recipeInstructions.length, 2);
  });

  test('picks the inner list when a wrapper shares the class pattern', () => {
    const doc = pageWith(`
      <h1>Stew</h1>
      <div class="ingredients-wrapper">
        <p>Intro paragraph that is not an ingredient.</p>
        <ul class="ingredients-list"><li>beef</li><li>potatoes</li><li>carrots</li></ul>
      </div>
      <ol class="directions"><li>Brown the beef well.</li><li>Simmer until tender.</li></ol>`);
    assert.deepEqual(extractRecipes(doc).recipes[0].recipeIngredient, ['beef', 'potatoes', 'carrots']);
  });

  test('does not treat class names that merely contain "step" as instructions', () => {
    const doc = pageWith(`
      <h1>Stew</h1>
      <ul class="ingredients"><li>beef</li><li>potatoes</li><li>carrots</li></ul>
      <ul class="footsteps"><li>This is a long unrelated item.</li><li>Another long unrelated item.</li></ul>`);
    assert.equal(extractRecipes(doc).success, false);
  });

  test('reports no recipe for an ordinary page with a heading', () => {
    const result = extractRecipes(pageWith('<h1>Breaking News</h1><p>Something happened today in the city.</p>'));
    assert.equal(result.success, false);
    assert.equal(result.noRecipe, true);
  });

  test('reports no recipe when only a small filter-style list is present', () => {
    const doc = pageWith('<h1>Shop</h1><ul class="ingredient-filter"><li>Gluten free</li></ul>');
    assert.equal(extractRecipes(doc).success, false);
  });
});

describe('formatRecipe', () => {
  const text = formatRecipe(pancakes, { sourceUrl: 'https://example.com/p' });

  test('includes header, byline, source, times and servings', () => {
    assert.match(text, /RECIPE: Pancakes & Syrup/);
    assert.match(text, /By: Jane Cook/);
    assert.match(text, /Source: https:\/\/example\.com\/p/);
    assert.match(text, /Prep Time: 10 minutes/);
    assert.match(text, /Cook Time: 1 hour 30 minutes/);
    assert.match(text, /Servings: 4\n/);
  });

  test('numbers ingredients and instructions and strips HTML', () => {
    assert.match(text, /1\. 1 cup flour/);
    assert.match(text, /2\. Add wet ingredients\./);
  });

  test('numbers steps across HowToSections and prints section headings', () => {
    const recipe = {
      ...pancakes,
      recipeInstructions: [
        { '@type': 'HowToSection', name: 'Batter', itemListElement: [{ '@type': 'HowToStep', text: 'Whisk.' }] },
        { '@type': 'HowToSection', name: 'Cook', itemListElement: [{ '@type': 'HowToStep', text: 'Fry.' }] }
      ]
    };
    const out = formatRecipe(recipe);
    assert.match(out, /Batter:\n1\. Whisk\./);
    assert.match(out, /Cook:\n2\. Fry\./);
  });

  test('recognises HowToSection when @type is an array', () => {
    const recipe = {
      ...pancakes,
      recipeInstructions: [
        { '@type': ['HowToSection'], name: 'Batter', itemListElement: [{ '@type': 'HowToStep', text: 'Whisk.' }] }
      ]
    };
    assert.match(formatRecipe(recipe), /Batter:\n1\. Whisk\./);
  });

  test('splits string instructions into numbered steps', () => {
    const out = formatRecipe({ ...pancakes, recipeInstructions: 'Mix.\nCook.<br>Serve.' });
    assert.match(out, /1\. Mix\.\n2\. Cook\.\n3\. Serve\./);
  });

  test('handles author as a plain string or list', () => {
    assert.match(formatRecipe({ ...pancakes, author: 'Sam' }), /By: Sam/);
    assert.match(formatRecipe({ ...pancakes, author: [{ name: 'A' }, { name: 'B' }] }), /By: A, B/);
  });

  test('scaled text shows the new amounts, the originals and the scale', () => {
    const out = formatRecipe(pancakes, { scale: 2 });
    assert.match(out, /Scale: Double/);
    assert.match(out, /Servings: 8\n/);
    assert.match(out, /1\. 2 cup flour \(was: 1 cup flour\)/);
    assert.match(out, /INSTRUCTIONS \(unchanged\):/);
  });
});

describe('scaleIngredient', () => {
  test('plain, fraction and mixed quantities', () => {
    assert.equal(scaled('2 cups flour', 2), '4 cups flour');
    assert.equal(scaled('1/2 cup milk', 2), '1 cup milk');
    assert.equal(scaled('1 1/2 cups oats', 2), '3 cups oats');
    assert.equal(scaled('1.5 tsp salt', 2), '3 tsp salt');
  });

  test('unicode fractions, including ones attached to a whole number', () => {
    assert.equal(scaled('½ cup sugar', 2), '1 cup sugar');
    assert.equal(scaled('2½ cups sugar', 2), '5 cups sugar');
    assert.equal(scaled('1½ tsp salt', 2), '3 tsp salt');
    assert.equal(scaled('2 ½ cups sugar', 0.5), '1 ¼ cups sugar');
  });

  test('halving and tripling give tidy fractions', () => {
    assert.equal(scaled('1 cup flour', 0.5), '½ cup flour');
    assert.equal(scaled('1/3 cup oil', 0.5), '⅙ cup oil');
    assert.equal(scaled('1/3 cup oil', 3), '1 cup oil');
    assert.equal(scaled('3/4 tsp salt', 3), '2 ¼ tsp salt');
  });

  test('ranges scale both ends', () => {
    assert.equal(scaled('2-3 tbsp oil', 2), '4-6 tbsp oil');
    assert.equal(scaled('1 to 2 cloves garlic', 2), '2-4 cloves garlic');
    assert.equal(scaled('1–2 tsp salt', 2), '2-4 tsp salt');
  });

  test('"1-1/2" is a mixed number, not a range', () => {
    assert.equal(scaled('1-1/2 cups flour', 2), '3 cups flour');
    assert.equal(scaled('2-3/4 cups milk', 0.5), '1 ⅜ cups milk');
    assert.equal(scaled('1/2-1 cup water', 2), '1-2 cup water'); // still a range
  });

  test('only the leading quantity changes', () => {
    assert.equal(scaled('1 (14 oz) can tomatoes', 2), '2 (14 oz) can tomatoes');
  });

  test('quantities with "optional", "dash" or "pinch" in the line are still scaled', () => {
    assert.equal(scaled('1 cup walnuts (optional)', 2), '2 cup walnuts (optional)');
    assert.equal(scaled('1 tbsp dashi powder', 2), '2 tbsp dashi powder');
    assert.equal(scaled('1 pinch saffron', 2), '2 pinch saffron');
  });

  test('lines without a quantity are unchanged, with a hint for "to taste"', () => {
    assert.deepEqual(scaleIngredient('salt to taste', 2),
      { original: 'salt to taste', scaled: 'salt to taste', changed: false, warning: 'Adjust to taste' });
    assert.equal(scaleIngredient('fresh parsley', 2).warning, null);
  });

  test('"2-inch piece" is a size, not a quantity', () => {
    assert.equal(scaled('2-inch piece ginger', 2), '2-inch piece ginger');
  });

  test('eggs round to whole or half amounts and suggest a workaround', () => {
    assert.equal(scaled('3 eggs', 2), '6 eggs');
    const half = scaleIngredient('3 large eggs', 0.5);
    assert.equal(half.scaled, '1 ½ large eggs');
    assert.match(half.warning, /1 large \+ 1 white/);
  });

  test('"egg whites by the cup" is not treated as a count of eggs', () => {
    assert.equal(scaled('1/3 cup egg whites', 0.5), '⅙ cup egg whites');
  });

  test('scale of 1 reports no change', () => {
    assert.equal(scaleIngredient('2 cups flour', 1).changed, false);
  });
});

describe('scaleYield and formatQuantity', () => {
  test('scales string, array and numeric yields', () => {
    assert.equal(scaleYield('4 servings', 2), '8 servings');
    assert.equal(scaleYield(['4', '4 servings'], 3), '12');
    assert.equal(scaleYield(4, 0.5), '2');
  });

  test('yield ranges scale both ends', () => {
    assert.equal(scaleYield('4-6 servings', 2), '8-12 servings');
    assert.equal(scaleYield('Serves 4 to 6', 0.5), 'Serves 2 to 3');
  });

  test('yields without a number, or with only a size, are returned as-is', () => {
    assert.equal(scaleYield('one loaf', 2), 'one loaf');
    assert.equal(scaleYield('8-inch pie', 2), '8-inch pie');
  });

  test('formatQuantity snaps near-fractions and avoids "2/2"', () => {
    assert.equal(formatQuantity(2.99), '3');
    assert.equal(formatQuantity(0.3333), '⅓');
    assert.equal(formatQuantity(1.5), '1 ½');
    assert.equal(formatQuantity(0.0625), '1/16');
    assert.equal(formatQuantity(0.1), '0.1'); // no tidy fraction nearby: plain decimal
  });
});
