import { chromium, Browser, Page } from 'playwright';
import { ScraperConfig, ScraperResult } from '../types/scraper';

export class GenericScraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrape(config: ScraperConfig): Promise<ScraperResult> {
    const startTime = new Date().toISOString();
    const debug = config.debug || false;
    
    try {
      if (debug) console.log(`[Scraper] Starting scrape for: ${config.url}`);
      
      if (!this.browser) {
        if (debug) console.log('[Scraper] Initializing browser...');
        await this.initialize();
      }

      if (debug) console.log('[Scraper] Creating browser context...');
      const context = await this.browser!.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();

      // Listen to console messages from the page
      if (debug) {
        page.on('console', msg => console.log(`[Page Console] ${msg.type()}: ${msg.text()}`));
        
        // Listen to page errors
        page.on('pageerror', error => console.log(`[Page Error] ${error.message}`));
        
        // Listen to request failures
        page.on('requestfailed', request => 
          console.log(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`)
        );
      }

      if (debug) console.log(`[Scraper] Navigating to ${config.url}...`);
      const navStart = Date.now();
      
      // Navigate to URL with more lenient wait condition
      await page.goto(config.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      const navDuration = Date.now() - navStart;
      if (debug) console.log(`[Scraper] Navigation completed in ${navDuration}ms`);

      // Wait for specific selector or timeout
      if (config.waitForSelector) {
        if (debug) console.log(`[Scraper] Waiting for selector: ${config.waitForSelector}`);
        try {
          await page.waitForSelector(config.waitForSelector, { timeout: 30000 });
          if (debug) console.log(`[Scraper] Selector found: ${config.waitForSelector}`);
        } catch (err) {
          if (debug) console.log(`[Scraper] WARNING: Selector not found: ${config.waitForSelector}`);
          if (debug) console.log(`[Scraper] Continuing anyway...`);
        }
      }
      if (config.waitForTimeout) {
        if (debug) console.log(`[Scraper] Waiting ${config.waitForTimeout}ms...`);
        await page.waitForTimeout(config.waitForTimeout);
      }

      if (debug) console.log(`[Scraper] Extracting data from ${Object.keys(config.selectors).length} selectors...`);
      
      // Extract data using selectors
      const data: Record<string, any> = {};
      for (const [key, selector] of Object.entries(config.selectors)) {
        try {
          const elements = await page.$$(selector);
          if (elements.length === 0) {
            if (debug) console.log(`[Scraper] No elements found for "${key}" (${selector})`);
            data[key] = null;
          } else if (elements.length === 1) {
            data[key] = await elements[0].textContent();
            
            // Special handling for temperature unit detection
            if (key === 'tempUnit') {
              const className = await elements[0].getAttribute('class');
              if (className?.includes('funits')) {
                data[key] = 'F';
              } else if (className?.includes('cunits')) {
                data[key] = 'C';
              }
            }
            
            if (debug) console.log(`[Scraper] Found 1 element for "${key}"`);
          } else {
            data[key] = await Promise.all(
              elements.map(el => el.textContent())
            );
            if (debug) console.log(`[Scraper] Found ${elements.length} elements for "${key}"`);
          }
        } catch (err) {
          if (debug) console.log(`[Scraper] Error extracting "${key}": ${err instanceof Error ? err.message : String(err)}`);
          data[key] = null;
        }
      }

      // Take screenshot if requested
      let screenshotBase64: string | undefined;
      if (config.screenshot) {
        if (debug) console.log('[Scraper] Taking screenshot...');
        const screenshot = await page.screenshot({ fullPage: true });
        screenshotBase64 = screenshot.toString('base64');
        if (debug) console.log(`[Scraper] Screenshot captured (${screenshot.length} bytes)`);
      }

      // Capture HTML source if requested
      let htmlSource: string | undefined;
      if (config.htmlSource) {
        if (debug) console.log('[Scraper] Capturing HTML source...');
        htmlSource = await page.content();
        if (debug) console.log(`[Scraper] HTML source captured (${htmlSource.length} characters)`);
      }

      await context.close();
      if (debug) console.log('[Scraper] Scraping completed successfully');

      return {
        success: true,
        data,
        screenshot: screenshotBase64,
        htmlSource,
        timestamp: startTime,
        url: config.url,
      };
    } catch (error) {
      console.error('[Scraper] Error during scraping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: startTime,
        url: config.url,
      };
    }
  }
}
