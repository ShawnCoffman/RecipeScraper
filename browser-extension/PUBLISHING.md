# Publishing the Extension

## Chrome Web Store (Chrome, Edge, Vivaldi)

Chrome, Edge and Vivaldi are all built on Chromium, so a single Chrome Web Store listing covers all three.

### Prerequisites

1. **A Google account** for the Chrome Web Store.
2. **The one-time developer fee** of $5 USD.
3. **Store assets**, listed below.

### Store assets

| Asset | Size | Required | Status |
| --- | --- | --- | --- |
| Screenshots | 1280x800 or 640x400, at least one | Yes | ✅ `store-assets/screenshot-light.png` and `screenshot-dark.png` |
| Extension icon | 16, 48 and 128 px | Yes | ✅ `icon16.png`, `icon48.png`, `icon128.png` (exported from `icon.svg` and `icon16.svg`) |
| Small promo tile | 440x280 | No | Not made |
| Marquee | 1400x560 | No | Not made |

### Publishing steps

#### Step 1: Register as a developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay the $5 one-time registration fee
4. Accept the terms of service

#### Step 2: Build the package

1. **Run the tests** from the repo root: `npm test`

2. **Zip only the files the extension needs** (from the repo root). Docs and tests should not ship, and neither should the signing key (`*.pem`):
   ```powershell
   Compress-Archive -DestinationPath recipe-scraper-extension.zip -Path `
     browser-extension\manifest.json, browser-extension\popup.html, browser-extension\popup.js, `
     browser-extension\recipe.js, browser-extension\icon16.png, browser-extension\icon48.png, `
     browser-extension\icon128.png
   ```
   The files must sit at the top level of the zip (not inside a folder); `Compress-Archive` with a list of files does this. The store adds the `key` and `update_url` fields to the manifest itself, so don't add them to the repo's `manifest.json`.

3. **Keep permissions unchanged where possible.** Adding a permission (or host access) makes Chrome disable the extension for existing users until they re-approve it. The extension currently uses `activeTab`, `scripting` and `downloads`.

#### Step 3: Upload to the Chrome Web Store

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click **New item**
3. Upload `recipe-scraper-extension.zip`
4. Fill out the store listing:

**Store listing text:**

```
Name: Recipe Scraper
Short Description: Extract recipes without the life stories - just ingredients and instructions!

Detailed Description:
Tired of scrolling through endless blog posts to find the recipe? Recipe Scraper extracts just 
what you need - ingredients, instructions, and cooking times - no ads, no life stories, just the recipe!

Features:
• Opens straight to the recipe - title, servings, time and a link back to the source
• Tick off ingredients as you cook
• Scale to ½×, 2× or 3×, with the original amount shown under each new one
• Handles fractions, ranges and eggs sensibly ("1-1/2 cups" doubles to "3 cups")
• Copy the recipe as clean text
• Save it as a .txt file in your Downloads folder - the popup shows exactly where
• Light and dark themes that follow your system
• Works on most recipe sites
• No tracking or data collection
• Completely free

How to Use:
1. Open any recipe page
2. Click the Recipe Scraper icon - the recipe appears automatically
3. Optionally pick ½×, 2× or 3× and tick off ingredients as you go
4. Copy it, or save it as a .txt file

Works on sites that publish Schema.org recipe markup (most major recipe sites and food blogs),
with a fallback for pages that don't.

Privacy: All processing happens locally in your browser. No data is collected or sent anywhere.
```

**Category:** Pick the closest match in the dashboard's list, such as Lifestyle → Household or Productivity → Tools.

**Language:** English

**Support URL:** https://github.com/ShawnCoffman/RecipeScraper/issues

5. Upload your screenshots
6. Set pricing to **Free**
7. Select regions (Worldwide recommended)

#### Privacy practices tab

The dashboard won't let you submit until this tab is filled in, and vague answers are a common reason for rejection.

**Single purpose:**
```
Shows the recipe from the current web page as a clean card (ingredients and steps only),
so it can be scaled, copied or saved as a text file.
```

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `activeTab` | Reads the recipe from the tab the user is on, only after they click the extension icon. |
| `scripting` | Runs the recipe extraction script in that tab, on demand. Nothing is injected into pages automatically. |
| `downloads` | Saves the recipe as a .txt file to the user's Downloads folder when they click Save .txt, then shows where it was saved and opens that folder on request. |

**Remote code:** No. All JavaScript is included in the package.

**Data usage:** Don't tick any data types. The extension doesn't collect or transmit user data. Tick all three certifications (no selling, no unrelated use, no creditworthiness use).

**Privacy policy** (paste into the field, or host it and link to it):
```
Recipe Scraper does not collect, store, or transmit any user data. All recipe extraction
happens locally in your browser. No analytics, no tracking, no data collection of any kind.
```

#### Step 4: Submit for review

1. Click **"Submit for Review"**
2. Review typically takes **1-3 days**
3. You'll receive an email when it's approved or if changes are needed

### After approval

Once approved, your extension will be available at:
- **Chrome Web Store:** `chromewebstore.google.com/detail/recipe-scraper/<extension-id>`
- **Edge:** Edge users can install from the Chrome Web Store, or you can submit a separate listing to Edge Add-ons (below).
- **Vivaldi:** installs from the Chrome Web Store.

## Microsoft Edge Add-ons (optional)

Edge users can already install from the Chrome Web Store, but a separate listing makes the extension show up in Edge's own store:

1. Sign in to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login). Registration is free.
2. Upload the same zip.
3. Fill in the listing, reusing the Chrome text above.
4. Submit for review.

## Tips

### Screenshots

- Use a recipe from a well-known site.
- Show the clean recipe card next to the cluttered original page.
- Feature scaling with the original amounts, checked-off ingredients, and Copy and Save .txt.
- The popup is 400px wide, so place it on a 1280x800 canvas rather than stretching it. One light and one dark shot works well.

### Description

- Lead with the problem it solves: no more scrolling past life stories.
- Keep it short and focused on benefits, with features as a bulleted list.

### After publishing

- Share it where home cooks gather, such as r/Cooking and r/recipes.
- Respond to reviews and feedback.
- Don't ask for or trade positive reviews. The store treats that as rating manipulation.

## Version updates

1. Raise the `version` in `manifest.json` (for example, 2.1.2 → 2.1.3). The store rejects an upload that isn't higher than the live version.
2. Run `npm test`, then build a new zip as in Step 2.
3. In the Developer Dashboard, open the existing item and upload the zip on the **Package** tab.
4. Add release notes describing the changes.
5. Submit for review.

## Support

- Issues and feature requests go to [GitHub issues](https://github.com/ShawnCoffman/RecipeScraper/issues), which is also the listing's support URL.
- Consider adding a support email to the listing.
