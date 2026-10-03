// Popup script. Extraction, scaling and formatting live in recipe.js.
const {
  scaleIngredient, scaleYield, formatRecipe, instructionLines, ingredientList, parseDuration, cleanText
} = RecipeScraper;

let allRecipes = [];
let recipe = null;           // raw recipe data on screen
let sourceUrl = null;
let scale = 1;
let checked = new Set();     // ingredient indexes ticked off; kept across rescaling

const $ = id => document.getElementById(id);
const rescanBtn = $('rescanBtn');
const statusEl = $('status');
const pickerEl = $('picker');
const recipeEl = $('recipe');
const actionsEl = $('actions');
const toastEl = $('toast');
const copyBtn = $('copyBtn');
const downloadBtn = $('downloadBtn');
const scaleButtons = Array.from(document.querySelectorAll('.scale-btn'));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ==================== VIEWS ====================

// Exactly one of: status message, recipe picker, recipe card.
function showView(view) {
  pickerEl.hidden = view !== 'picker';
  recipeEl.hidden = view !== 'recipe';
  actionsEl.hidden = view !== 'recipe';
  if (view !== 'status') statusEl.textContent = '';
}

function showStatus(title, body) {
  showView('status');
  statusEl.textContent = '';
  statusEl.appendChild(el('strong', '', title));
  if (body) statusEl.appendChild(document.createTextNode(body));
}

let toastTimer = null;
function toast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastTimer = setTimeout(() => { toastEl.textContent = ''; }, 4000);
}

// Errors thrown when the browser won't let the extension run on a page
// (chrome:// pages, the Web Store, the built-in PDF viewer, etc.)
function showError(error) {
  if (/cannot access|extensions gallery|cannot be scripted|missing host permission/i.test(error.message)) {
    showStatus("Can't read this page", 'Open a recipe on a regular website and try again.');
  } else {
    showStatus('Something went wrong', error.message);
  }
}

// ==================== RECIPE CARD ====================

function yieldText(recipeData) {
  const raw = recipeData.recipeYield;
  if (raw === undefined || raw === null || raw === '') return null;
  const text = scale === 1
    ? String(Array.isArray(raw) ? raw[0] : raw)
    : scaleYield(raw, scale);
  return /^[\d\s.½¼¾⅓⅔⅛⅜⅝⅞-]+$/.test(text) ? `Serves ${text.trim()}` : cleanText(text);
}

function renderMeta() {
  const meta = $('recipeMeta');
  meta.textContent = '';
  const parts = [];

  const servings = yieldText(recipe);
  if (servings) parts.push(servings);

  const time = recipe.totalTime || recipe.cookTime;
  if (time) parts.push(parseDuration(time));

  parts.forEach((part, i) => {
    if (i > 0) meta.appendChild(document.createTextNode(' · '));
    meta.appendChild(document.createTextNode(part));
  });

  if (sourceUrl) {
    try {
      const link = el('a', '', new URL(sourceUrl).hostname.replace(/^www\./, ''));
      link.href = sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      if (parts.length > 0) meta.appendChild(document.createTextNode(' · '));
      meta.appendChild(link);
    } catch (e) {
      // Not a parseable URL; leave the source out
    }
  }
}

function renderIngredients() {
  const list = $('ingredients');
  list.textContent = '';

  ingredientList(recipe).forEach((text, i) => {
    const item = scaleIngredient(text, scale);
    const li = el('li');
    if (checked.has(i)) li.classList.add('done');

    const label = el('label');
    const box = el('input');
    box.type = 'checkbox';
    box.checked = checked.has(i);
    box.addEventListener('change', () => {
      if (box.checked) checked.add(i); else checked.delete(i);
      li.classList.toggle('done', box.checked);
    });

    const body = el('span');
    body.appendChild(el('span', 'ingredient-text', scale === 1 ? text : item.scaled));
    if (scale !== 1 && item.changed) body.appendChild(el('span', 'was', `was ${item.original}`));
    if (scale !== 1 && item.warning) body.appendChild(el('span', 'note', item.warning));

    label.append(box, body);
    li.appendChild(label);
    list.appendChild(li);
  });
}

// Steps are numbered straight through, even across section headings.
function renderSteps() {
  const container = $('steps');
  container.textContent = '';
  const lines = instructionLines(recipe.recipeInstructions);
  $('stepsSection').hidden = lines.length === 0;
  $('stepsHint').hidden = scale === 1;

  let list = null;
  let stepNum = 1;
  lines.forEach(line => {
    if (line.heading) {
      container.appendChild(el('h3', '', line.heading));
      list = null;
    } else {
      if (!list) {
        list = el('ol', 'steps');
        list.start = stepNum;
        container.appendChild(list);
      }
      list.appendChild(el('li', '', line.step));
      stepNum++;
    }
  });
}

function renderScaled() {
  scaleButtons.forEach(btn => {
    btn.setAttribute('aria-pressed', String(parseFloat(btn.dataset.scale) === scale));
  });
  renderMeta();
  renderIngredients();
  renderSteps();
}

function selectRecipe(index) {
  recipe = allRecipes[index];
  scale = 1;
  checked = new Set();
  toastEl.textContent = '';
  $('saved').hidden = true;

  $('recipeTitle').textContent = recipe.name ? cleanText(String(recipe.name)) : 'Untitled recipe';
  const others = $('otherRecipesBtn');
  others.hidden = allRecipes.length < 2;
  others.textContent = `${allRecipes.length} recipes on this page`;

  renderScaled();
  showView('recipe');
  document.querySelector('main').scrollTop = 0;
}

function showPicker() {
  const list = $('pickerList');
  list.textContent = '';
  $('pickerTitle').textContent = `${allRecipes.length} recipes on this page`;
  allRecipes.forEach((r, index) => {
    const button = el('button', '', r.name ? cleanText(String(r.name)) : `Recipe ${index + 1}`);
    button.addEventListener('click', () => selectRecipe(index));
    list.appendChild(button);
  });
  showView('picker');
  list.firstChild.focus();
}

$('otherRecipesBtn').addEventListener('click', showPicker);

scaleButtons.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    scale = parseFloat(btn.dataset.scale);
    renderScaled();
  });

  btn.addEventListener('keydown', (e) => {
    const target = {
      ArrowLeft: scaleButtons[index - 1],
      ArrowRight: scaleButtons[index + 1],
      Home: scaleButtons[0],
      End: scaleButtons[scaleButtons.length - 1]
    }[e.key];
    if (target) {
      e.preventDefault();
      target.focus();
    }
  });
});

// ==================== EXTRACTION ====================

async function extract() {
  rescanBtn.disabled = true;
  showStatus('Reading this page…');
  allRecipes = [];
  recipe = null;
  sourceUrl = null;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const target = { tabId: tab.id };

    // The extension only touches the page you're on, and only when you ask.
    await chrome.scripting.executeScript({ target, files: ['recipe.js'] });
    const [{ result }] = await chrome.scripting.executeScript({
      target,
      func: () => globalThis.RecipeScraper.extractRecipes(document)
    });

    if (result && result.success) {
      allRecipes = result.recipes;
      sourceUrl = result.url;
      if (allRecipes.length > 1) showPicker(); else selectRecipe(0);
    } else if (result && result.noRecipe) {
      showStatus('No recipe on this page', 'Open a single recipe, not a search or category page.');
    } else {
      showStatus("Couldn't read a recipe here", result?.error);
    }
  } catch (error) {
    showError(error);
  } finally {
    rescanBtn.disabled = false;
  }
}

rescanBtn.addEventListener('click', extract);

// ==================== COPY / DOWNLOAD ====================

// Plain-text version of what's on screen, for Copy and Save
function recipeText() {
  return formatRecipe(recipe, { scale, sourceUrl });
}

let copyTimer = null;
copyBtn.addEventListener('click', async () => {
  if (!recipe) return;
  try {
    await navigator.clipboard.writeText(recipeText());
    copyBtn.textContent = 'Copied';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  } catch (error) {
    toast("Couldn't copy to the clipboard. Try again.");
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!recipe) return;

  const slug = (recipe.name ? cleanText(String(recipe.name)) : '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const filename = (slug || 'recipe') + '.txt';

  // A data: URL carries the text itself, so nothing has to outlive the popup.
  // saveAs: false skips the Save As dialog (which belongs to the popup and is
  // cancelled if the popup closes) and saves straight to the downloads folder.
  const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(recipeText());

  savedEl.hidden = true;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Saving…';
  try {
    const id = await chrome.downloads.download({ url, filename, saveAs: false });
    const item = await finishedDownload(id);
    savedId = id;
    $('savedPath').textContent = item.filename;
    savedEl.hidden = false;
  } catch (error) {
    toast(`Couldn't save the file. ${error.message}`);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Save .txt';
  }
});

// Resolves with the DownloadItem once Chrome has written the file, so we can
// show its real path (Chrome may add " (1)" if the name is taken).
function finishedDownload(id) {
  return new Promise((resolve, reject) => {
    let timer = null;

    async function check() {
      const [item] = await chrome.downloads.search({ id });
      if (!item || item.state === 'in_progress') return;
      chrome.downloads.onChanged.removeListener(onChanged);
      clearTimeout(timer);
      if (item.state === 'complete') resolve(item);
      else reject(new Error(item.error ? `(${item.error})` : 'The download was cancelled.'));
    }

    function onChanged(delta) {
      if (delta.id === id && delta.state) check();
    }

    chrome.downloads.onChanged.addListener(onChanged);
    timer = setTimeout(() => {
      chrome.downloads.onChanged.removeListener(onChanged);
      reject(new Error('It is taking too long. Check your downloads.'));
    }, 10000);
    check(); // it may already be done
  });
}

let savedId = null;
const savedEl = $('saved');
$('showFileBtn').addEventListener('click', () => {
  if (savedId !== null) chrome.downloads.show(savedId);
});

extract();
