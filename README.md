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
```
GET /health
```

### List Available Scrapers
```
GET /scrapers
```

### Run Predefined Scraper
```
POST /scrape/:name
```

### Run Custom Scraper
```
POST /scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "waitForSelector": ".content",
  "selectors": {
    "title": "h1",
    "paragraphs": "p"
  },
  "screenshot": false
}
```

## Adding New Scrapers

Add your scraper configurations in `src/scrapers/` following the pattern in `example-scraper.ts`.
