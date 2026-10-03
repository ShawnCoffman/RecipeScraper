# Recipe Scraper Browser Extension 🍳

A Chrome/Edge browser extension that extracts recipes from cooking websites without all the life stories and ads. Just click the extension icon on any recipe page!

## Features

✅ **Automatic Extraction** - The recipe is extracted as soon as you open the popup  
✅ **Clean Format** - Title, author, source link, ingredients, numbered instructions, prep/cook/total times, and servings  
✅ **Scale Recipes** - Half, Double or Triple, with original and scaled amounts side by side  
✅ **Recipe Picker** - If a page has more than one recipe, choose the one you want  
✅ **Copy** - Instantly copy the recipe (at the size you picked)  
✅ **Save .txt** - Saves to your downloads folder and tells you exactly where
✅ **Works on Most Recipe Sites** - Reads Schema.org Recipe markup, with a fallback for pages without it  
✅ **No Server Needed** - All processing happens in your browser  

## Installation

### Chrome/Edge

Install from the Chrome Web Store, or load it locally:

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The Recipe Scraper icon should now appear in your extensions toolbar

Firefox is not supported and there are no plans to add it.

## How to Use

1. Navigate to a recipe page
2. Click the Recipe Scraper extension icon in your browser toolbar
3. The recipe appears in the popup - no ads, no stories, just the recipe! (Use the ↻ button to scan the page again.)
4. Choose **½×**, **1×**, **2×** or **3×** to scale the ingredients and servings, and tick off ingredients as you go
5. Click **Copy** or **Save .txt** to keep it

### About scaling

- Only the leading quantity of each ingredient changes: `1 (14 oz) can tomatoes` doubles to `2 (14 oz) can tomatoes`. Mixed numbers, fractions (`1/2`, `½`, `2½`) and ranges (`2-3`) are supported.
- Eggs round to whole or half amounts, with a note when you land on a half.
- Lines like "salt to taste" are left alone and flagged.
- Instructions are never changed. Cooking times, pan sizes and seasoning don't always scale with quantity, so check them when you scale up or down.

## Supported Sites

Works on any site that publishes Schema.org Recipe markup (JSON-LD), which covers most major recipe sites and food blogs, including WordPress recipe plugins that use `@graph`.

For pages without that markup, a fallback parser looks for an ingredient list (an element whose class contains "ingredient") and an instructions list (class names such as "instructions", "directions", "method" or "steps"). A page only counts as a recipe if it has at least 3 ingredients and 2 instruction steps.

## How It Works

When the popup opens (or you click ↻), the extension:
1. Injects `recipe.js` into the current tab, on demand. Nothing runs on a page until you open the popup.
2. Collects the Schema.org Recipe data from the page, including `@graph` and array structures, or falls back to HTML parsing
3. Returns the raw recipe data to the popup, which shows it as a recipe card and applies any scaling. Copy and Save use a plain-text version (HTML tags stripped, entities decoded, ISO durations such as `PT1H30M` shown as "1 hour 30 minutes")

## Privacy

- No data is sent to any server
- All recipe extraction happens locally in your browser
- Permissions: `activeTab` (read the page you're on, when you open the popup), `scripting` (run the extraction), and `downloads` (save the .txt to your downloads folder and show it there)
- No tracking, no analytics, no nonsense

## Troubleshooting

**"No recipe found on this page"**
- Make sure you're on an actual recipe page, not a search or category page
- The site might not use standard recipe markup
- Try refreshing the page and clicking ↻ in the popup

**"Can't read this page"**
- Browsers don't let extensions run on pages like `chrome://` settings, the Chrome Web Store, or the built-in PDF viewer. Open a recipe on a regular website.

**Extension doesn't appear**
- Make sure Developer mode is enabled
- Try reloading the extension
- Check the browser console for errors

## Development

`recipe.js` holds the extraction, scaling and formatting logic. The same file is loaded by the popup, injected into pages, and required by the tests. From the repo root:

```
npm install
npm test
```

See [PUBLISHING.md](PUBLISHING.md) for packaging and store submission.

## Future Enhancements

- [ ] Export to other formats (Markdown, etc.)
- [ ] Nutrition information extraction

Enjoy your recipe scraping without the life stories! 🎉
