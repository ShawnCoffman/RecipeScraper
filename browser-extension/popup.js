// Popup script
let currentRecipe = null;

const extractBtn = document.getElementById('extractBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');
const outputDiv = document.getElementById('output');

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Extract recipe from current tab using on-demand injection
extractBtn.addEventListener('click', async () => {
  extractBtn.disabled = true;
  extractBtn.textContent = 'Extracting...';
  outputDiv.textContent = '';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  currentRecipe = null;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject the extraction function into the current tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractRecipeFromPage
    });
    
    extractBtn.disabled = false;
    extractBtn.textContent = 'Extract Recipe';
    
    const result = results[0].result;
    
    if (result && result.success) {
      currentRecipe = result.recipe;
      outputDiv.textContent = result.recipe;
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      showStatus('Recipe extracted successfully!', 'success');
    } else {
      showStatus(result?.error || 'No recipe found on this page', 'error');
    }
  } catch (error) {
    extractBtn.disabled = false;
    extractBtn.textContent = 'Extract Recipe';
    showStatus('Error: ' + error.message, 'error');
  }
});

// This function gets injected into the page
function extractRecipeFromPage() {
  // All extraction logic runs in the page context
  
  function isRecipeSchema(data) {
    if (!data || typeof data !== 'object') return false;
    const type = data['@type'];
    if (Array.isArray(type)) {
      return type.includes('Recipe');
    }
    return type === 'Recipe';
  }

  function parseDuration(duration) {
    if (!duration || typeof duration !== 'string' || !duration.startsWith('P')) {
      return duration;
    }
    let str = duration.substring(1);
    let days = 0, hours = 0, minutes = 0, seconds = 0;
    const parts = str.split('T');
    if (parts[0]) {
      const dayMatch = parts[0].match(/(\d+)D/);
      if (dayMatch) days = parseInt(dayMatch[1]);
    }
    if (parts[1]) {
      const hourMatch = parts[1].match(/(\d+)H/);
      const minMatch = parts[1].match(/(\d+)M/);
      const secMatch = parts[1].match(/(\d+)S/);
      if (hourMatch) hours = parseInt(hourMatch[1]);
      if (minMatch) minutes = parseInt(minMatch[1]);
      if (secMatch) seconds = parseInt(secMatch[1]);
    }
    const result = [];
    if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) result.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    return result.length > 0 ? result.join(' ') : duration;
  }

  function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  function extractRecipeSchema() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (isRecipeSchema(item)) return item;
          }
        } else if (Array.isArray(data)) {
          for (const item of data) {
            if (isRecipeSchema(item)) return item;
          }
        } else if (isRecipeSchema(data)) {
          return data;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  function extractRecipeFallback() {
    const recipe = {};
    const title = document.querySelector('h1');
    if (title) recipe.name = title.textContent.trim();
    
    const ingredientsSection = document.querySelector('[class*="ingredient" i], [class*="ingredients" i]');
    if (ingredientsSection) {
      const ingredients = [];
      ingredientsSection.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text) ingredients.push(text);
      });
      if (ingredients.length > 0) recipe.recipeIngredient = ingredients;
    }
    
    const instructionsSection = document.querySelector('[class*="instruction" i], [class*="directions" i], [class*="step" i]');
    if (instructionsSection) {
      const instructions = [];
      instructionsSection.querySelectorAll('li, p').forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length > 10) instructions.push(text);
      });
      if (instructions.length > 0) recipe.recipeInstructions = instructions;
    }
    return Object.keys(recipe).length > 0 ? recipe : null;
  }

  function formatRecipe(recipeData) {
    if (!recipeData) return null;
    let output = [];
    output.push('='.repeat(80));
    const name = cleanText(recipeData.name) || 'Unknown Recipe';
    output.push(`RECIPE: ${name}`);
    output.push('='.repeat(80));
    if (recipeData.description) {
      output.push('');
      output.push(cleanText(recipeData.description));
      output.push('');
    }
    if (recipeData.prepTime) output.push(`Prep Time: ${parseDuration(recipeData.prepTime)}`);
    if (recipeData.cookTime) output.push(`Cook Time: ${parseDuration(recipeData.cookTime)}`);
    if (recipeData.totalTime) output.push(`Total Time: ${parseDuration(recipeData.totalTime)}`);
    if (recipeData.recipeYield) {
      let yieldInfo = recipeData.recipeYield;
      if (Array.isArray(yieldInfo)) yieldInfo = yieldInfo[0];
      output.push(`Servings: ${yieldInfo}`);
    }
    output.push('');
    output.push('-'.repeat(80));
    output.push('INGREDIENTS:');
    output.push('-'.repeat(80));
    const ingredients = recipeData.recipeIngredient || [];
    ingredients.forEach((ingredient, i) => {
      output.push(`${i + 1}. ${cleanText(ingredient)}`);
    });
    output.push('');
    output.push('-'.repeat(80));
    output.push('INSTRUCTIONS:');
    output.push('-'.repeat(80));
    const instructions = recipeData.recipeInstructions || [];
    let stepNum = 1;
    if (Array.isArray(instructions)) {
      instructions.forEach(instruction => {
        if (typeof instruction === 'object' && instruction !== null) {
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
          } else {
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

  // Main extraction logic
  let recipeData = extractRecipeSchema();
  if (!recipeData) {
    recipeData = extractRecipeFallback();
  }
  if (recipeData) {
    const formatted = formatRecipe(recipeData);
    return { success: true, recipe: formatted, data: recipeData };
  } else {
    return { success: false, error: 'No recipe found on this page' };
  }
}

// Copy recipe to clipboard
copyBtn.addEventListener('click', async () => {
  if (!currentRecipe) return;
  
  try {
    await navigator.clipboard.writeText(currentRecipe);
    showStatus('Recipe copied to clipboard!', 'success');
  } catch (error) {
    showStatus('Failed to copy to clipboard', 'error');
  }
});

// Download recipe as text file
downloadBtn.addEventListener('click', () => {
  if (!currentRecipe) return;
  
  // Get recipe name for filename
  const firstLine = currentRecipe.split('\n').find(line => line.startsWith('RECIPE:'));
  let filename = 'recipe.txt';
  
  if (firstLine) {
    const recipeName = firstLine.replace('RECIPE:', '').trim();
    filename = recipeName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '.txt';
  }
  
  const blob = new Blob([currentRecipe], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatus('Recipe downloaded!', 'success');
});

// Auto-extract on popup open
window.addEventListener('load', () => {
  showStatus('Click "Extract Recipe" to get started', 'info');
});
