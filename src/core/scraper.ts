import { chromium, Browser, Page } from 'playwright';
import { ScraperConfig, ScraperResult } from '../types/scraper';

export class GenericScraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrape(config: ScraperConfig): Promise<ScraperResult> {
    const startTime = new Date().toISOString();
    
    try {
      if (!this.browser) {
        await this.initialize();
      }

      const context = await this.browser!.newContext();
      const page = await context.newPage();

      // Navigate to URL
      await page.goto(config.url, { waitUntil: 'networkidle' });

      // Wait for specific selector or timeout
      if (config.waitForSelector) {
        await page.waitForSelector(config.waitForSelector, { timeout: 30000 });
      }
      if (config.waitForTimeout) {
        await page.waitForTimeout(config.waitForTimeout);
      }

      // Extract data using selectors
      const data: Record<string, any> = {};
      for (const [key, selector] of Object.entries(config.selectors)) {
        try {
          const elements = await page.$$(selector);
          if (elements.length === 0) {
            data[key] = null;
          } else if (elements.length === 1) {
            data[key] = await elements[0].textContent();
          } else {
            data[key] = await Promise.all(
              elements.map(el => el.textContent())
            );
          }
        } catch (err) {
          data[key] = null;
        }
      }

      // Take screenshot if requested
      let screenshotBase64: string | undefined;
      if (config.screenshot) {
        const screenshot = await page.screenshot({ fullPage: true });
        screenshotBase64 = screenshot.toString('base64');
      }

      await context.close();

      return {
        success: true,
        data,
        screenshot: screenshotBase64,
        timestamp: startTime,
        url: config.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: startTime,
        url: config.url,
      };
    }
  }
}
