// Content script that extracts recipe data from the current page
(function() {
  'use strict';

  // Extract recipe from Schema.org JSON-LD markup
  function extractRecipeSchema() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        
        // Handle @graph structure (WordPress sites)
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (isRecipeSchema(item)) {
              return item;
            }
          }
        }
        // Handle array of items
        else if (Array.isArray(data)) {
          for (const item of data) {
            if (isRecipeSchema(item)) {
              return item;
            }
          }
        }
        // Handle single object
        else if (isRecipeSchema(data)) {
          return data;
        }
      } catch (e) {
        // Skip invalid JSON
        continue;
      }
    }
    
    return null;
  }

  // Check if data is a recipe schema
  function isRecipeSchema(data) {
    if (!data || typeof data !== 'object') return false;
    
    const type = data['@type'];
    if (Array.isArray(type)) {
      return type.includes('Recipe');
    }
    return type === 'Recipe';
  }

  // Convert ISO 8601 duration (PT10M) to readable format (10 minutes)
  function parseDuration(duration) {
    if (!duration || typeof duration !== 'string' || !duration.startsWith('P')) {
      return duration;
    }
    
    let str = duration.substring(1); // Remove 'P'
    let days = 0, hours = 0, minutes = 0, seconds = 0;
    
    // Split on 'T' to separate date and time
    const parts = str.split('T');
    
    if (parts[0]) {
      // Parse days
      const dayMatch = parts[0].match(/(\d+)D/);
      if (dayMatch) days = parseInt(dayMatch[1]);
    }
    
    if (parts[1]) {
      // Parse hours, minutes, seconds
      const hourMatch = parts[1].match(/(\d+)H/);
      const minMatch = parts[1].match(/(\d+)M/);
      const secMatch = parts[1].match(/(\d+)S/);
      
      if (hourMatch) hours = parseInt(hourMatch[1]);
      if (minMatch) minutes = parseInt(minMatch[1]);
      if (secMatch) seconds = parseInt(secMatch[1]);
    }
    
    // Build readable string
    const result = [];
    if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) result.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    
    return result.length > 0 ? result.join(' ') : duration;
  }

  // Decode HTML entities
  function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback: Try to extract recipe from common HTML patterns
  function extractRecipeFallback() {
    const recipe = {};
    
    // Try to find title
    const title = document.querySelector('h1');
    if (title) {
      recipe.name = title.textContent.trim();
    }
    
    // Try to find ingredients
    const ingredientsSection = document.querySelector('[class*="ingredient" i], [class*="ingredients" i]');
    if (ingredientsSection) {
      const ingredients = [];
      const items = ingredientsSection.querySelectorAll('li');
      items.forEach(li => {
        const text = li.textContent.trim();
        if (text) ingredients.push(text);
      });
      if (ingredients.length > 0) {
        recipe.recipeIngredient = ingredients;
      }
    }
    
    // Try to find instructions
    const instructionsSection = document.querySelector('[class*="instruction" i], [class*="directions" i], [class*="step" i]');
    if (instructionsSection) {
      const instructions = [];
      const items = instructionsSection.querySelectorAll('li, p');
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length > 10) {
          instructions.push(text);
        }
      });
      if (instructions.length > 0) {
        recipe.recipeInstructions = instructions;
      }
    }
    
    return Object.keys(recipe).length > 0 ? recipe : null;
  }

  // Format recipe data for display
  function formatRecipe(recipeData) {
    if (!recipeData) return null;
    
    let output = [];
    output.push('=' .repeat(80));
    
    // Title
    const name = cleanText(recipeData.name) || 'Unknown Recipe';
    output.push(`RECIPE: ${name}`);
    output.push('='.repeat(80));
    
    // Description
    if (recipeData.description) {
      output.push('');
      output.push(cleanText(recipeData.description));
      output.push('');
    }
    
    // Times
    if (recipeData.prepTime) {
      output.push(`Prep Time: ${parseDuration(recipeData.prepTime)}`);
    }
    if (recipeData.cookTime) {
      output.push(`Cook Time: ${parseDuration(recipeData.cookTime)}`);
    }
    if (recipeData.totalTime) {
      output.push(`Total Time: ${parseDuration(recipeData.totalTime)}`);
    }
    
    // Servings
    if (recipeData.recipeYield) {
      let yieldInfo = recipeData.recipeYield;
      if (Array.isArray(yieldInfo)) {
        yieldInfo = yieldInfo[0];
      }
      output.push(`Servings: ${yieldInfo}`);
    }
    
    // Ingredients
    output.push('');
    output.push('-'.repeat(80));
    output.push('INGREDIENTS:');
    output.push('-'.repeat(80));
    
    const ingredients = recipeData.recipeIngredient || [];
    ingredients.forEach((ingredient, i) => {
      output.push(`${i + 1}. ${cleanText(ingredient)}`);
    });
    
    // Instructions
    output.push('');
    output.push('-'.repeat(80));
    output.push('INSTRUCTIONS:');
    output.push('-'.repeat(80));
    
    const instructions = recipeData.recipeInstructions || [];
    let stepNum = 1;
    
    if (Array.isArray(instructions)) {
      instructions.forEach(instruction => {
        if (typeof instruction === 'object' && instruction !== null) {
          // Handle HowToSection
          if (instruction['@type'] === 'HowToSection') {
            const sectionName = instruction.name || '';
            if (sectionName) {
              output.push('');
              output.push(`${cleanText(sectionName)}:`);
            }
            
            const steps = instruction.itemListElement || [];
            steps.forEach(step => {
              const text = step.text || step.name || '';
              if (text) {
                output.push(`${stepNum}. ${cleanText(text)}`);
                stepNum++;
              }
            });
          }
          // Handle HowToStep or plain object
          else {
            const text = instruction.text || instruction.name || '';
            if (text) {
              output.push(`${stepNum}. ${cleanText(text)}`);
              stepNum++;
            }
          }
        } else {
          output.push(`${stepNum}. ${cleanText(instruction)}`);
          stepNum++;
        }
      });
    } else if (typeof instructions === 'string') {
      output.push(cleanText(instructions));
    }
    
    output.push('');
    output.push('='.repeat(80));
    
    return output.join('\n');
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractRecipe') {
      // Try schema.org markup first
      let recipeData = extractRecipeSchema();
      
      // Fallback to HTML parsing
      if (!recipeData) {
        recipeData = extractRecipeFallback();
      }
      
      if (recipeData) {
        const formatted = formatRecipe(recipeData);
        sendResponse({ success: true, recipe: formatted, data: recipeData });
      } else {
        sendResponse({ success: false, error: 'No recipe found on this page' });
      }
    }
    
    return true; // Keep message channel open for async response
  });
})();
