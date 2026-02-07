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
- ✅ Already done! (icon16.png, icon48.png, icon128.png)

### Publishing Steps

#### Step 1: Register as a Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay the $5 one-time registration fee
4. Accept the terms of service

#### Step 2: Prepare Your Extension Package

1. **Zip your extension folder**:
   ```powershell
   Compress-Archive -Path browser-extension\* -DestinationPath recipe-scraper-extension.zip
   ```

2. **Make sure these files are included**:
   - manifest.json
   - popup.html
   - popup.js
   - content.js
   - icon16.png, icon48.png, icon128.png
   - README.md (optional, for your reference)

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
• One-click recipe extraction
• Clean, formatted output
• Copy to clipboard
• Download as text file
• Works on most recipe sites
• No tracking or data collection
• Completely free

How to Use:
1. Navigate to any recipe website
2. Click the Recipe Scraper icon
3. Click "Extract Recipe"
4. Copy or download - done!

Supports sites with Schema.org markup including AllRecipes, Food Network, Bon Appétit, 
Serious Eats, and most food blogs.

Privacy: All processing happens locally in your browser. No data is collected or sent anywhere.
```

**Category:** Productivity or Fun

**Language:** English

**Privacy Policy:** Since you're not collecting any data, you can use this simple statement:
```
Recipe Scraper does not collect, store, or transmit any user data. All recipe extraction 
happens locally in your browser. No analytics, no tracking, no data collection of any kind.
```

5. Upload your screenshots
6. Set pricing to **Free**
7. Select regions (Worldwide recommended)

#### Step 4: Submit for Review

1. Click **"Submit for Review"**
2. Review typically takes **1-3 days**
3. You'll receive an email when it's approved or if changes are needed

### After Approval

Once approved, your extension will be available at:
- **Chrome Web Store**: `chrome.google.com/webstore/detail/your-extension-id`
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

## Firefox Add-ons (Future)

For Firefox, you'll need to make small changes to `manifest.json`:
- Change `manifest_version` to 2 (Firefox doesn't fully support v3 yet)
- Adjust some permission declarations
- Submit to [addons.mozilla.org](https://addons.mozilla.org)

Let me know if you want help with the Firefox version!

## Tips for Success

### Good Screenshots
1. Use the extension on a popular recipe site like AllRecipes
2. Show the clean output vs the cluttered original page
3. Highlight key features (Copy, Download buttons)

### Description Tips
- Focus on the problem it solves (no more life stories!)
- Keep it concise and benefit-focused
- Use bullet points for features
- Mention popular supported sites

### After Publishing
- Share on social media
- Post in relevant subreddits (r/Cooking, r/recipes)
- Ask friends to leave positive reviews
- Respond to user feedback

## Version Updates

When you make improvements:

1. Update the `version` in manifest.json (e.g., 1.0 → 1.1)
2. Create a new zip file
3. Upload to the Developer Dashboard
4. Add release notes describing changes
5. Submit for review

## Monetization (Optional)

Your extension is currently free, but if you want to monetize later:
- Keep the extension free with a "Buy Me a Coffee" link
- Add premium features with in-app purchases
- Create a companion service

## Support & Maintenance

Consider adding:
- A support email in the listing
- A GitHub repository for issues/feature requests
- A simple website with FAQs

---

**Ready to publish?** Just need to:
1. Pay the $5 Chrome Web Store fee
2. Take 2-3 screenshots
3. Zip and upload!

Good luck! 🚀
