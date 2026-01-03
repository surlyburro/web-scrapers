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

        // Listen to network requests
        page.on('request', request => {
          const method = request.method();
          const url = request.url();
          const type = request.resourceType();
          try {
            const hostname = new URL(url).hostname;
            // Only log wunderground.com requests (including subdomains)
            if ((type === 'document' || type === 'xhr' || type === 'fetch') && hostname.endsWith('wunderground.com')) {
              console.log(`[Network Request] ${method} ${url} (${type})`);
            }
          } catch (err) {
            // Invalid URL, skip
          }
        });

        // Listen to network responses
        page.on('response', async response => {
          const url = response.url();
          const status = response.status();
          const type = response.request().resourceType();
          try {
            const hostname = new URL(url).hostname;
            // Only log wunderground.com responses (including subdomains)
            if ((type === 'document' || type === 'xhr' || type === 'fetch') && hostname.endsWith('wunderground.com')) {
              console.log(`[Network Response] ${status} ${url} (${type})`);
            }
          } catch (err) {
            // Invalid URL, skip
          }
        });
      }

      if (debug) console.log(`[Scraper] Navigating to ${config.url}...`);
      const navStart = Date.now();
      
      // Navigate to URL with more lenient wait condition
      await page.goto(config.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      const navDuration = Date.now() - navStart;
      if (debug) console.log(`[Scraper] [${page.url()}] Navigation completed in ${navDuration}ms`);

      // Handle page interactions (form fills, clicks, etc.)
      if (config.interactions && config.interactions.length > 0) {
        if (debug) console.log(`[Scraper] [${page.url()}] Executing ${config.interactions.length} interactions...`);
        
        for (const interaction of config.interactions) {
          if (interaction.type === 'fill' && interaction.selector) {
            const value = interaction.paramName ? (config as any)[interaction.paramName] : interaction.value;
            const stringValue = value ? String(value) : '';
            if (debug) console.log(`[Scraper] [${page.url()}] Filling "${interaction.selector}" with "${stringValue}"`);
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let filled = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.fill(stringValue);
                  filled = true;
                  if (debug) console.log(`[Scraper] [${page.url()}] Successfully filled visible element`);
                  break;
                }
              } catch (err) {
                // Skip this element and try next
                continue;
              }
            }
            if (!filled) {
              throw new Error(`Could not find visible element for selector: ${interaction.selector}`);
            }
          } else if (interaction.type === 'type' && interaction.selector) {
            const value = interaction.paramName ? (config as any)[interaction.paramName] : interaction.value;
            const stringValue = value ? String(value) : '';
            if (debug) console.log(`[Scraper] [${page.url()}] Typing "${stringValue}" into "${interaction.selector}"`);
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let typed = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.type(stringValue, { delay: 100 }); // Type with delay between characters
                  typed = true;
                  if (debug) console.log(`[Scraper] [${page.url()}] Successfully typed into visible element`);
                  break;
                }
              } catch (err) {
                // Skip this element and try next
                continue;
              }
            }
            if (!typed) {
              throw new Error(`Could not find visible element for selector: ${interaction.selector}`);
            }
          } else if (interaction.type === 'click' && interaction.selector) {
            if (debug) console.log(`[Scraper] [${page.url()}] Clicking "${interaction.selector}"`);
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let clicked = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.press('Enter');
                  clicked = true;
                  if (debug) console.log(`[Scraper] [${page.url()}] Successfully pressed Enter on visible element`);
                  break;
                }
              } catch (err) {
                continue;
              }
            }
            if (!clicked) {
              throw new Error(`Could not find visible element for selector: ${interaction.selector}`);
            }
          } else if (interaction.type === 'keyPress' && interaction.selector && interaction.key) {
            if (debug) console.log(`[Scraper] [${page.url()}] Pressing key "${interaction.key}" on "${interaction.selector}"`);
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let pressed = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.press(interaction.key);
                  pressed = true;
                  if (debug) console.log(`[Scraper] [${page.url()}] Successfully pressed "${interaction.key}" on visible element`);
                  break;
                }
              } catch (err) {
                continue;
              }
            }
            if (!pressed) {
              throw new Error(`Could not find visible element for selector: ${interaction.selector}`);
            }
          } else if (interaction.type === 'waitForNavigation') {
            if (debug) console.log(`[Scraper] [${page.url()}] Waiting for navigation...`);
            // Wait for actual URL change
            await Promise.race([
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
              page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
                // networkidle might timeout, that's ok
              })
            ]);
            if (debug) console.log(`[Scraper] [${page.url()}] Navigation complete`);
          } else if (interaction.type === 'wait' && interaction.duration) {
            if (debug) console.log(`[Scraper] [${page.url()}] Waiting ${interaction.duration}ms...`);
            await page.waitForTimeout(interaction.duration);
          } else if (interaction.type === 'waitForSelector' && interaction.selector) {
            if (debug) console.log(`[Scraper] [${page.url()}] Waiting for selector to be visible: ${interaction.selector}`);
            await page.locator(interaction.selector).first().waitFor({ state: 'visible', timeout: 10000 });
            if (debug) console.log(`[Scraper] [${page.url()}] Selector is now visible`);
          }
        }
      }

      // Wait for specific selector or timeout
      if (config.waitForSelector) {
        if (debug) console.log(`[Scraper] [${page.url()}] Waiting for selector: ${config.waitForSelector}`);
        try {
          await page.waitForSelector(config.waitForSelector, { timeout: 30000 });
          if (debug) console.log(`[Scraper] [${page.url()}] Selector found: ${config.waitForSelector}`);
        } catch (err) {
          if (debug) console.log(`[Scraper] [${page.url()}] WARNING: Selector not found: ${config.waitForSelector}`);
          if (debug) console.log(`[Scraper] [${page.url()}] Continuing anyway...`);
        }
      }
      if (config.waitForTimeout) {
        if (debug) console.log(`[Scraper] [${page.url()}] Waiting ${config.waitForTimeout}ms...`);
        await page.waitForTimeout(config.waitForTimeout);
      }

      if (debug) console.log(`[Scraper] [${page.url()}] Extracting data from ${Object.keys(config.selectors).length} selectors...`);
      
      // Extract data using selectors
      const data: Record<string, any> = {};
      for (const [key, selector] of Object.entries(config.selectors)) {
        try {
          const elements = await page.$$(selector);
          if (elements.length === 0) {
            if (debug) console.log(`[Scraper] [${page.url()}] No elements found for "${key}" (${selector})`);
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
            
            if (debug) console.log(`[Scraper] [${page.url()}] Found 1 element for "${key}"`);
          } else {
            data[key] = await Promise.all(
              elements.map(el => el.textContent())
            );
            if (debug) console.log(`[Scraper] [${page.url()}] Found ${elements.length} elements for "${key}"`);
          }
        } catch (err) {
          if (debug) console.log(`[Scraper] [${page.url()}] Error extracting "${key}": ${err instanceof Error ? err.message : String(err)}`);
          data[key] = null;
        }
      }

      // Take screenshot if requested
      let screenshotBase64: string | undefined;
      if (config.screenshot) {
        if (debug) console.log(`[Scraper] [${page.url()}] Taking screenshot...`);
        const screenshot = await page.screenshot({ fullPage: true });
        screenshotBase64 = screenshot.toString('base64');
        if (debug) console.log(`[Scraper] [${page.url()}] Screenshot captured (${screenshot.length} bytes)`);
      }

      // Capture HTML source if requested
      let htmlSource: string | undefined;
      if (config.htmlSource) {
        if (debug) console.log(`[Scraper] [${page.url()}] Capturing HTML source...`);
        htmlSource = await page.content();
        if (debug) console.log(`[Scraper] [${page.url()}] HTML source captured (${htmlSource.length} characters)`);
      }

      await context.close();
      if (debug) console.log(`[Scraper] [${page.url()}] Scraping completed successfully`);

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
