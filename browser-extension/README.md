# Recipe Scraper for Chrome and Edge

Recipe Scraper pulls the recipe out of a cooking website and shows it on its own, without the life story or the ads. Open a recipe page and click the extension icon.

## Features

- **Opens straight to the recipe.** The page is read as soon as you open the popup.
- **A clean recipe card.** Title, servings, time and a link back to the source, followed by ingredients and numbered steps.
- **Check off ingredients** as you cook. Ticks are kept when you change the size.
- **Scale to ½×, 2× or 3×.** The original amount is shown under each scaled one.
- **Choose between recipes** when a page has more than one.
- **Copy** the recipe as plain text at the size you picked, including the author, description and prep and cook times.
- **Save as .txt** to your downloads folder. The popup shows exactly where the file went.
- **Light and dark themes** that follow your system setting.
- **Works on most recipe sites**, with a fallback for pages that don't publish standard recipe data.
- **Private.** Everything runs in your browser. Nothing is sent anywhere.

## Installation

Install it from the Chrome Web Store, or load it from this folder:

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `browser-extension` folder.
5. The Recipe Scraper icon appears in your extensions toolbar.

Firefox is not supported, and there are no plans to add it.

## Using it

1. Open a recipe page.
2. Click the Recipe Scraper icon in the toolbar.
3. The recipe appears in the popup. To read the page again, use the **Scan page again** button in the header.
4. Choose **½×**, **1×**, **2×** or **3×** to scale the ingredients and servings, and check off ingredients as you go.
5. Click **Copy** or **Save .txt** to keep it.

### How scaling works

- Only the leading quantity of each ingredient changes, so `1 (14 oz) can tomatoes` doubles to `2 (14 oz) can tomatoes`.
- Mixed numbers (`1 1/2`, and `1-1/2` as many US sites write it), fractions (`1/2`, `½`, `2½`) and ranges (`2-3`, `1 to 2`) are all understood.
- Servings scale too, including ranges: `4-6 servings` doubles to `8-12 servings`.
- Eggs round to whole or half amounts, with a note when the result is a half.
- Lines such as "salt to taste" are left alone and flagged.
- Instructions are never changed. Cooking times, pan sizes and seasoning don't always scale with quantity, so check them when you scale up or down.

## Supported sites

Recipe Scraper works on any site that publishes Schema.org recipe data (JSON-LD), which covers most major recipe sites and food blogs. That includes WordPress recipe plugins that use `@graph`, pages that nest the recipe under `mainEntity`, and pages with lists of recipes.

Some sites list ingredient names in that data but leave the amounts out, showing them only on the page. When the page's ingredient list matches the recipe item for item, the extension uses the page's lines so the amounts come through.

For pages with no recipe data, a fallback looks for an ingredient list (an element whose class contains "ingredient") and an instructions list (classes such as "instructions", "directions", "method" or "steps"). It reads ordinary lists as well as ingredients laid out as rows, and skips hidden text such as a metric amount shown only on toggle. A page counts as a recipe only if it has at least 3 ingredients and 2 steps.

## How it works

When the popup opens, or you click **Scan page again**, the extension:

1. Injects `recipe.js` into the current tab. Nothing runs on a page until you open the popup.
2. Collects the recipe data from anywhere in the page's JSON-LD, fills in missing amounts from the page if needed, or falls back to reading the page directly.
3. Returns the raw recipe data to the popup, which shows it as a recipe card and applies any scaling.

Copy and Save use a plain-text version: HTML tags are removed, entities are decoded, and durations such as `PT1H30M` read as "1 hour 30 minutes".

## Privacy

- No data is sent to any server.
- All extraction happens locally in your browser.
- No tracking and no analytics.
- Permissions:
  - `activeTab` reads the page you're on, when you open the popup.
  - `scripting` runs the extraction.
  - `downloads` saves the .txt file to your downloads folder and shows it there.

## Troubleshooting

**"No recipe on this page"**

- Make sure you're on a single recipe, not a search or category page.
- The site may not use standard recipe markup.
- Refresh the page, then click **Scan page again** in the popup.

**"Can't read this page"**

- Browsers don't let extensions run on some pages, such as `chrome://` settings, the Chrome Web Store and the built-in PDF viewer. Open a recipe on a regular website.

**Where did my .txt file go?**

- After saving, the popup shows the full path and a **Show in folder** button.
- Files go to Chrome's download location (Settings → Downloads), which is your Downloads folder unless you've changed it. If a file with the same name already exists, Chrome adds ` (1)` to the new one.

**The extension doesn't appear**

- Make sure Developer mode is on.
- Try reloading the extension.
- To see errors, right-click inside the open popup, choose **Inspect**, and open the Console tab.

## Development

`recipe.js` holds the extraction, scaling and formatting logic. The same file is loaded by the popup, injected into pages and required by the tests. From the repository root:

```
npm install
npm test
```

See [PUBLISHING.md](PUBLISHING.md) for packaging and store submission.

## Possible additions

- Export to other formats, such as Markdown
- Nutrition information
