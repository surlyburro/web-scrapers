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
# Run Wunderground scraper without debug logging or screenshot
curl -X POST http://localhost:3000/scrape/wunderground-home

# Run Wunderground scraper with debug logging
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"debug": true}'

# Run with screenshot capture
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"screenshot": true}'

# Run with both debug logging and screenshot
curl -X POST http://localhost:3000/scrape/wunderground-home \
  -H "Content-Type: application/json" \
  -d '{"debug": true, "screenshot": true}'

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

export const mySiteConfigs: Record<string, ScraperConfig> = {
  'mysite-home': mySiteConfig,
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
