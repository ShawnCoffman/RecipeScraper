# Recipe Scraper 🍳

Tired of scrolling through endless backstories about someone's grandmother's second cousin's trip to Italy before getting to the actual recipe? This tool cuts through the noise and extracts just the recipe you need.

## Features

- ✂️ Extracts recipes without the life stories
- 📋 Gets ingredients, instructions, prep/cook times, and servings
- 💾 Save recipes to text files
- 🔍 Uses Schema.org markup for accurate extraction
- 🔄 Fallback method for sites without proper markup

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

**Note:** The scraper uses `cloudscraper` to bypass Cloudflare protection on sites that block automated requests. This is automatically handled - no configuration needed!

## Usage

### Basic Usage
```bash
python recipe_scraper.py <recipe_url>
```

### Save Directly to File
```bash
python recipe_scraper.py <recipe_url> output_file.txt
```

### Examples
```bash
# Display recipe in terminal
python recipe_scraper.py https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/

# Save to file
python recipe_scraper.py https://www.foodnetwork.com/recipes/alton-brown/chewy-chocolate-chip-cookies-recipe-1953702 cookies.txt
```

## How It Works

The scraper works by:
1. Fetching the webpage
2. Looking for structured recipe data (JSON-LD Schema.org markup) - most modern recipe sites use this
3. If no structured data is found, it falls back to parsing common HTML patterns
4. Formatting and displaying the recipe in a clean, readable format

## Supported Sites

Works best with sites that use Schema.org Recipe markup, including:
- AllRecipes
- Food Network
- Serious Eats
- Bon Appétit
- Tasty
- Most major recipe blogs

## Tips

- The scraper works best on dedicated recipe pages
- Some sites may block automated requests - the tool uses standard headers to avoid this
- If a site doesn't work, it likely uses non-standard markup or heavy JavaScript rendering

## Example Output

```
================================================================================
RECIPE: Best Chocolate Chip Cookies
================================================================================

Prep Time: PT15M
Cook Time: PT10M
Servings: 24 cookies

--------------------------------------------------------------------------------
INGREDIENTS:
--------------------------------------------------------------------------------
1. 2 cups all-purpose flour
2. 1 teaspoon baking soda
3. 1/2 teaspoon salt
...

--------------------------------------------------------------------------------
INSTRUCTIONS:
--------------------------------------------------------------------------------

1. Preheat oven to 375 degrees F.
2. Combine flour, baking soda, and salt in a bowl.
3. Beat butter, sugar, and brown sugar until creamy.
...
```

## License

Free to use. Scrape responsibly and respect website terms of service.
