# Recipe Scraper Browser Extension 🍳

A Chrome/Edge browser extension that extracts recipes from cooking websites without all the life stories and ads. Just click the extension icon on any recipe page!

## Features

✅ **One-Click Extraction** - Click the extension icon on any recipe page  
✅ **Clean Format** - Get ingredients, instructions, prep/cook times, and servings  
✅ **Copy to Clipboard** - Instantly copy the recipe to your clipboard  
✅ **Download as Text** - Save recipes as text files  
✅ **Works Everywhere** - Supports most recipe sites with Schema.org markup  
✅ **No Server Needed** - All processing happens in your browser  

## Installation

### Chrome/Edge

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The Recipe Scraper icon should now appear in your extensions toolbar

### Firefox - No plans

## How to Use

1. Navigate to any recipe website (AllRecipes, Food Network, food blogs, etc.)
2. Click the Recipe Scraper extension icon in your browser toolbar
3. Click "Extract Recipe"
4. The recipe will appear in the popup - no ads, no stories, just the recipe!
5. Click "Copy to Clipboard" or "Download as Text" to save it

## Supported Sites

Works on any site that uses Schema.org Recipe markup, including:
- AllRecipes
- Food Network
- Serious Eats
- Bon Appétit
- Most food blogs and recipe sites

The extension also has a fallback parser for sites without proper markup.

## How It Works

The extension:
1. Scans the current page for JSON-LD Schema.org recipe data
2. Handles complex structures like @graph (WordPress sites)
3. Falls back to HTML parsing if no structured data is found
4. Formats everything cleanly with ingredients, instructions, and timing info

## Privacy

- No data is sent to any server
- All recipe extraction happens locally in your browser
- No tracking, no analytics, no nonsense

## Tips

- Works best on dedicated recipe pages
- If extraction fails, try refreshing the page
- Some sites with heavy JavaScript may take a moment to load

## Troubleshooting

**"No recipe found on this page"**
- Make sure you're on an actual recipe page
- The site might not use standard recipe markup
- Try refreshing the page

**Extension doesn't appear**
- Make sure Developer mode is enabled
- Try reloading the extension
- Check the browser console for errors

## Future Enhancements

- [ ] Add recipe categories/tags
- [ ] Save recipes to local storage
- [ ] Export to various formats (PDF, Markdown, etc.)
- [ ] Recipe collection manager
- [ ] Nutrition information extraction

Enjoy your recipe scraping without the life stories! 🎉
