import { ScraperConfig } from '../types/scraper';

// Example configuration for a news site
export const exampleNewsConfig: ScraperConfig = {
  url: 'https://example.com/news',
  waitForSelector: '.article-list',
  selectors: {
    headlines: '.article-title',
    descriptions: '.article-description',
    authors: '.article-author',
  },
  screenshot: false,
  headless: true,
};

// You can add more site-specific configurations here
export const scraperConfigs: Record<string, ScraperConfig> = {
  'example-news': exampleNewsConfig,
};
