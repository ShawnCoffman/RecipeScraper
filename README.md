# Recipe Scraper 🍳

Tired of scrolling through endless backstories about someone's grandmother's second cousin's trip to Italy before getting to the actual recipe? This tool cuts through the noise and extracts just the recipe you need.

## Features

- ✂️ Extracts recipes without the life stories
- 📋 Gets ingredients, instructions, prep/cook times, and servings
- 💾 Save recipes to text files
- 🔍 Uses Schema.org markup for accurate extraction
- 🔄 Fallback method for sites without proper markup


# Recipe Scraper — Chrome/Edge Extension 🍳

This repository now provides a Chrome/Edge browser extension that extracts recipes directly from pages you visit in your browser. The previous Python command-line scraper is no longer the primary interface — the extension replaces that workflow.

For full usage, installation, and development details, see the extension README:

- [browser-extension/README.md](browser-extension/README.md)

Quick start — load the extension locally:

1. Open `chrome://extensions/` (or `edge://extensions/`) in your browser.
2. Enable "Developer mode" in the top-right corner.
3. Click "Load unpacked" and select the `browser-extension` folder from this repo.
4. The Recipe Scraper icon should appear in your extensions toolbar.

Use the extension by opening any recipe page and clicking the Recipe Scraper icon, then choose "Extract Recipe" in the popup.

If you still need the legacy Python scraper or have scripts that depend on it, check the repository history or open an issue — the old CLI may be available in a previous commit or a `legacy/` branch.

If you'd like, I can also update any other docs or badges to reflect this change.
