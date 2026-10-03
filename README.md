# Recipe Scraper 🍅

Tired of scrolling through endless backstories about someone's grandmother's second cousin's trip to Italy before getting to the actual recipe? Recipe Scraper is a Chrome/Edge extension that cuts through the noise and shows just the recipe.

## Features

- ✂️ Extracts recipes without the life stories, automatically when you open the popup
- 📋 Shows a recipe card: title, servings, time and source link, then ingredients and numbered steps
- ☑️ Tick off ingredients as you cook
- ⚖️ Scale a recipe to ½×, 2× or 3×, with the original amount shown under each scaled one
- 📑 Pages with several recipes let you choose which one to use
- 📎 Copy the recipe as plain text, including author, description and prep/cook times
- 💾 Save it as a `.txt` file in your downloads folder; the popup shows exactly where
- 🌗 Light and dark themes that follow your system
- 🔍 Reads Schema.org Recipe markup (JSON-LD), with a fallback for pages without it
- 🔒 Runs entirely in your browser; nothing is sent to a server

## Quick Start

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `browser-extension` folder from this repo.
4. Open any recipe page and click the Recipe Scraper icon. The recipe is extracted automatically (use the ↻ button to scan the page again).
5. Pick a size (½×, 1×, 2×, 3×) if you want to scale it, tick off ingredients as you go, then use **Copy** or **Save .txt**.

For more detail (supported sites, troubleshooting, privacy), see [browser-extension/README.md](browser-extension/README.md).

## Repository Layout

```
RecipeScraper/
├── README.md                   # This file
├── package.json                # Dev tooling only (test runner + jsdom); not part of the extension
├── test/
│   └── recipe.test.js          # Tests for extraction, scaling and formatting
├── store-assets/               # Chrome Web Store screenshots (1280x800, light and dark)
└── browser-extension/          # The extension (load this folder unpacked)
    ├── manifest.json           # Manifest V3 config
    ├── popup.html              # Popup UI and styles
    ├── popup.js                # Popup logic: injects recipe.js, renders the recipe card, scaling, recipe picker, copy/save
    ├── recipe.js               # Extraction, scaling and text formatting (shared by the popup, the page and the tests)
    ├── icon16.png              # Toolbar icon
    ├── icon48.png              # Extensions page icon
    ├── icon128.png             # Store/install icon
    ├── icon.svg                # Icon source for icon48/icon128 (not shipped)
    ├── icon16.svg              # Pixel-aligned source for icon16 (not shipped)
    ├── PUBLISHING.md           # Chrome Web Store packaging and publishing notes
    └── README.md               # Extension usage and troubleshooting
```

## Configuration

The extension uses Manifest V3. The current version number is in `browser-extension/manifest.json`.

| Setting | Value |
| --- | --- |
| Permissions | `activeTab`, `scripting`, `downloads` |
| Popup | `popup.html` |
| Icons | `icon16.png`, `icon48.png`, `icon128.png` |
| Content scripts | None declared |
| Host permissions | None |

Why each permission is needed:
- `activeTab` lets the extension read the page you're on, only after you open the popup.
- `scripting` injects `recipe.js` into that tab.
- `downloads` saves the `.txt` straight to your Chrome downloads folder, reads back where it landed, and opens that folder from **Show in folder**. There is no Save As dialog: it belongs to the popup, and closing the popup cancels it.

## How It Works

1. Opening the popup (or clicking ↻) looks up the active tab.
2. `popup.js` injects `recipe.js` into that tab with `chrome.scripting.executeScript`, then calls `RecipeScraper.extractRecipes`. This returns the raw recipe data: every distinct `Recipe` found in the page's JSON-LD, or one recipe from the HTML fallback.
3. The popup formats and scales the recipe itself, using the same `recipe.js` loaded in `popup.html`.
4. **Save .txt** passes the text to `chrome.downloads` as a `data:` URL with `saveAs: false`, waits for the file to finish, then shows its full path in the popup.

The HTML fallback only reports a recipe if it finds an ingredient list (3+ items) and an instructions list (2+ items), so ordinary pages don't show up as recipes.

## Development

```
npm install
npm test
```

Tests run the real `recipe.js` against small HTML pages using jsdom. See [browser-extension/PUBLISHING.md](browser-extension/PUBLISHING.md) for packaging a store release (only the files the extension needs go in the zip).

## Notes

- Firefox is not supported and there are no plans to add it.
- The original Python command-line scraper has been removed; the extension is the only interface.
- Never commit the extension's signing key (`*.pem`); it is git-ignored.
