# Publishing Your Browser Extension

## Chrome Web Store (Chrome, Edge, Vivaldi)

Good news! Chrome, Edge, and Vivaldi all use Chromium, so one submission works for all three.

### Prerequisites

1. **Google Account** - You'll need one for the Chrome Web Store
2. **One-time Developer Fee** - $5 USD registration fee
3. **Store Assets** - Prepare promotional images

### Required Assets

Before publishing, you need:

#### 1. Screenshots (Required)
- ✅ Ready: `store-assets/screenshot-light.png` and `store-assets/screenshot-dark.png` (1280x800)
- **At least 1** screenshot (1280x800 or 640x400 pixels)
- Show the extension in action
- Recommendation: Take 2-3 screenshots showing:
  - The extension popup with a recipe extracted
  - The extension icon in the toolbar
  - A before/after comparison

#### 2. Promotional Images (Optional but Recommended)
- **Small tile**: 440x280 pixels
- **Marquee**: 1400x560 pixels
- These appear in the Chrome Web Store listing

#### 3. Extension Icon
- ✅ Already done! (icon16.png, icon48.png, icon128.png, exported from icon.svg and icon16.svg)

### Publishing Steps

#### Step 1: Register as a Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay the $5 one-time registration fee
4. Accept the terms of service

#### Step 2: Prepare Your Extension Package

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

#### Step 3: Upload to Chrome Web Store

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click **"New Item"**
3. Upload your `recipe-scraper-extension.zip`
4. Fill out the store listing:

**Store Listing Information:**

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

#### Privacy Practices Tab

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

#### Step 4: Submit for Review

1. Click **"Submit for Review"**
2. Review typically takes **1-3 days**
3. You'll receive an email when it's approved or if changes are needed

### After Approval

Once approved, your extension will be available at:
- **Chrome Web Store**: `chromewebstore.google.com/detail/recipe-scraper/your-extension-id`
- **Edge Add-ons** (optional): Can also submit directly to Microsoft Edge Add-ons
- **Vivaldi**: Uses Chrome Web Store automatically

Users can then install with one click!

## Microsoft Edge Add-ons (Optional)

If you want a dedicated Edge listing:

1. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login)
2. Register (free, no fee unlike Chrome)
3. Upload the same extension package
4. Fill out similar listing information
5. Submit for review

**Benefit:** Direct presence in Edge Add-ons store, but not required since Edge users can install from Chrome Web Store.

## Tips for Success

### Good Screenshots
1. Use the extension on a popular recipe site like AllRecipes
2. Show the clean recipe card next to the cluttered original page
3. Highlight key features: scaling with the original amounts, ticked-off ingredients, Copy and Save .txt
4. The popup is 400px wide, so place it on a 1280x800 canvas rather than stretching it; one light and one dark shot works well

### Description Tips
- Focus on the problem it solves (no more life stories!)
- Keep it concise and benefit-focused
- Use bullet points for features
- Mention popular supported sites

### After Publishing
- Share on social media
- Post in relevant subreddits (r/Cooking, r/recipes)
- Respond to user feedback and reviews
- Don't ask for or trade positive reviews; the store's policies treat that as rating manipulation

## Version Updates

When you make improvements:

1. Update the `version` in manifest.json (e.g., 2.1.1 → 2.1.2)
2. Create a new zip file
3. Upload to the Developer Dashboard
4. Add release notes describing changes
5. Submit for review

## Support & Maintenance

- Issues and feature requests: [GitHub issues](https://github.com/ShawnCoffman/RecipeScraper/issues), also used as the listing's support URL
- Consider adding a support email to the listing

