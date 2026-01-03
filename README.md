# web-scrapers

A generic web scraping service built with Node.js, TypeScript, and Playwright.

## Features

- Generic scraping library with configurable selectors
- HTTP API for invoking scrapers
- Site-specific scraper configurations
- Docker support
- Screenshot capability

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run production
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t web-scrapers .
docker run -p 3000:3000 web-scrapers
```

## API Endpoints

### Health Check
```bash
GET /health
```

Returns the health status of the service.

```bash
curl http://localhost:3000/health
```

### List Available Scrapers
```bash
GET /scrapers
```

Returns a list of all predefined scraper configurations.

```bash
curl http://localhost:3000/scrapers
```

Response:
```json
{
  "scrapers": ["example-news", "wunderground-home"]
}
```

### Run Predefined Scraper
```bash
POST /scrape/:name
Content-Type: application/json
```

Run a predefined scraper by name. Optionally enable debug logging and/or screenshot capture.

**Examples:**

```bash
# Run Wunderground homepage scraper
curl -X POST http://localhost:3000/scrape/wunderground-home

# Run Wunderground location scraper with zipcode
curl -X POST http://localhost:3000/scrape/wunderground-location \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "94607"}'

# Run location scraper with debug logging
curl -X POST http://localhost:3000/scrape/wunderground-location \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "94607", "debug": true}'

# Run with debug logging
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"debug": true}'

# Run with screenshot capture
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"screenshot": true}'

# Run with HTML source capture
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"htmlSource": true}'

# Run with both debug logging and screenshot
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"debug": true, "screenshot": true}'

# Run with all options
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"debug": true, "screenshot": true, "htmlSource": true}'

# Run example news scraper
curl -X POST http://localhost:3000/scrape/example-news
```

Response (without screenshot):
```json
{
  "success": true,
  "data": {
    "currentTemp": "72°",
    "condition": "Partly Cloudy",
    "location": "San Francisco, CA"
  },
  "timestamp": "2026-01-02T12:00:00.000Z",
  "url": "https://www.wunderground.com/"
}
```

Response (with screenshot):
```json
{
  "success": true,
  "data": {
    "currentTemp": "72°",
    "condition": "Partly Cloudy",
    "location": "San Francisco, CA"
  },
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "url": "https://www.wunderground.com/"
}
```

### Run Custom Scraper
```bash
POST /scrape
Content-Type: application/json
```

Run a custom scraper with your own configuration.

**Request Body:**
```json
{
  "url": "https://example.com",
  "waitForSelector": ".content",
  "waitForTimeout": 2000,
  "selectors": {
    "title": "h1",
    "paragraphs": "p",
    "links": "a"
  },
  "screenshot": false,
  "debug": true
}
```

**Parameters:**
- `url` (required): The URL to scrape
- `waitForSelector` (optional): CSS selector to wait for before scraping
- `waitForTimeout` (optional): Additional milliseconds to wait after page load
- `selectors` (required): Object mapping data keys to CSS selectors
- `screenshot` (optional): Whether to capture a full-page screenshot (returned as base64)
- `htmlSource` (optional): Whether to capture the HTML source after page load
- `debug` (optional): Enable detailed logging output

**Example:**

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "waitForSelector": ".content",
    "selectors": {
      "title": "h1",
      "paragraphs": "p"
    },
    "screenshot": true,
    "htmlSource": true,
    "debug": true
  }'
```

**Note on Screenshots:**
- Screenshots are returned as base64-encoded PNG images in the `screenshot` field
- They can be large (100KB - 2MB+) depending on page size
- To save a screenshot from the response, decode the base64 string:
  ```bash
  # Using jq to extract and decode
  curl -X POST http://localhost:3000/scrape/wunderground-home \
    -H "Content-Type: application/json" \
    -d '{"screenshot": true}' | \
    jq -r '.screenshot' | base64 -d > screenshot.png
  ```

**Note on HTML Source:**
- `htmlSource` captures the full HTML after JavaScript execution and page rendering
- This is useful for debugging selector issues or understanding the page structure
- The HTML source can be very large (100KB - 5MB+)
- To save HTML source to a file:
  ```bash
  curl -X POST http://localhost:3000/scrape/wunderground-home \
    -H "Content-Type: application/json" \
    -d '{"htmlSource": true}' | \
    jq -r '.htmlSource' > page-source.html
  ```

## Adding New Scrapers

To add a new site scraper:

1. Create a new directory under `src/scrapers/{site-name}/`
2. Create a configuration file (e.g., `{site-name}.ts`) with your scraper configs
3. Export your configs in a format like:

```typescript
import { ScraperConfig } from '../../types/scraper';

export const mySiteConfig: ScraperConfig = {
  url: 'https://example.com',
  waitForSelector: '[data-testid="content"]',
  selectors: {
    title: 'h1',
    description: '.description',
  },
  screenshot: false,
  headless: true,
};

// Example with URL parameters
export const mySiteLocationConfig: ScraperConfig = {
  url: 'https://example.com/{city}/{state}',
  urlParams: ['city', 'state'],
  waitForSelector: '[data-testid="content"]',
  selectors: {
    title: 'h1',
    description: '.description',
  },
  screenshot: false,
  headless: true,
};

export const mySiteConfigs: Record<string, ScraperConfig> = {
  'mysite-home': mySiteConfig,
  'mysite-location': mySiteLocationConfig,
};
```

4. Import and add to `src/scrapers/index.ts`:

```typescript
import { mySiteConfigs } from './mysite/mysite';

export const scraperConfigs: Record<string, ScraperConfig> = {
  ...exampleConfigs,
  ...wundergroundConfigs,
  ...mySiteConfigs,  // Add your configs here
};
```

See [src/scrapers/wunderground/wunderground.ts](src/scrapers/wunderground/wunderground.ts) for a complete example.
