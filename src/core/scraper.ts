import { chromium, Browser, Page } from 'playwright';
import { ScraperConfig, ScraperResult } from '../types/scraper';
import { scraperLogger, browserLogger } from '../utils/logger';

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
      if (debug) scraperLogger.info({ url: config.url }, 'Starting scrape');
      
      if (!this.browser) {
        if (debug) scraperLogger.debug('Initializing browser');
        await this.initialize();
      }

      if (debug) scraperLogger.debug('Creating browser context');
      const context = await this.browser!.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();

      // Listen to console messages from the page
      if (debug) {
        page.on('console', msg => browserLogger.debug({ type: msg.type(), text: msg.text() }, 'Page console'));
        
        // Listen to page errors
        page.on('pageerror', error => browserLogger.error({ error: error.message }, 'Page error'));
        
        // Listen to request failures
        page.on('requestfailed', request => 
          browserLogger.warn({ url: request.url(), error: request.failure()?.errorText }, 'Request failed')
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
              browserLogger.debug({ method, url, type }, 'Network request');
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
              browserLogger.debug({ status, url, type }, 'Network response');
            }
          } catch (err) {
            // Invalid URL, skip
          }
        });
      }

      if (debug) scraperLogger.debug({ url: config.url }, 'Navigating');
      const navStart = Date.now();
      
      // Navigate to URL with more lenient wait condition
      await page.goto(config.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      const navDuration = Date.now() - navStart;
      if (debug) scraperLogger.info({ url: page.url(), duration: navDuration }, 'Navigation completed');

      // Handle page interactions (form fills, clicks, etc.)
      if (config.interactions && config.interactions.length > 0) {
        if (debug) scraperLogger.debug({ url: page.url(), count: config.interactions.length }, 'Executing interactions');
        
        for (const interaction of config.interactions) {
          if (interaction.type === 'fill' && interaction.selector) {
            const value = interaction.paramName ? (config as any)[interaction.paramName] : interaction.value;
            const stringValue = value ? String(value) : '';
            if (debug) scraperLogger.debug({ selector: interaction.selector, value: stringValue }, 'Filling element');
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let filled = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.fill(stringValue);
                  filled = true;
                  if (debug) scraperLogger.debug('Successfully filled visible element');
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
            if (debug) scraperLogger.debug({ selector: interaction.selector, value: stringValue }, 'Typing into element');
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let typed = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.type(stringValue, { delay: 100 }); // Type with delay between characters
                  typed = true;
                  if (debug) scraperLogger.debug('Successfully typed into visible element');
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
            if (debug) scraperLogger.debug({ selector: interaction.selector }, 'Clicking element');
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let clicked = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.press('Enter');
                  clicked = true;
                  if (debug) scraperLogger.debug('Successfully pressed Enter on visible element');
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
            if (debug) scraperLogger.debug({ selector: interaction.selector, key: interaction.key }, 'Pressing key');
            
            // Find the first visible element among all matches
            const elements = await page.locator(interaction.selector).all();
            let pressed = false;
            for (const element of elements) {
              try {
                if (await element.isVisible()) {
                  await element.press(interaction.key);
                  pressed = true;
                  if (debug) scraperLogger.debug({ key: interaction.key }, 'Successfully pressed key on visible element');
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
            if (debug) scraperLogger.debug({ url: page.url() }, 'Waiting for navigation');
            // Wait for actual URL change
            await Promise.race([
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
              page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
                // networkidle might timeout, that's ok
              })
            ]);
            if (debug) scraperLogger.info({ url: page.url() }, 'Navigation complete');
          } else if (interaction.type === 'wait' && interaction.duration) {
            if (debug) scraperLogger.debug({ duration: interaction.duration }, 'Waiting');
            await page.waitForTimeout(interaction.duration);
          } else if (interaction.type === 'waitForSelector' && interaction.selector) {
            if (debug) scraperLogger.debug({ selector: interaction.selector }, 'Waiting for selector');
            await page.locator(interaction.selector).first().waitFor({ state: 'visible', timeout: 10000 });
            if (debug) scraperLogger.debug({ selector: interaction.selector }, 'Selector is now visible');
          }
        }
      }

      // Wait for specific selector or timeout
      if (config.waitForSelector) {
        if (debug) scraperLogger.debug({ selector: config.waitForSelector }, 'Waiting for selector');
        try {
          await page.waitForSelector(config.waitForSelector, { timeout: 30000 });
          if (debug) scraperLogger.debug({ selector: config.waitForSelector }, 'Selector found');
        } catch (err) {
          if (debug) scraperLogger.warn({ selector: config.waitForSelector }, 'Selector not found');
          if (debug) scraperLogger.debug('Continuing anyway');
        }
      }
      if (config.waitForTimeout) {
        if (debug) scraperLogger.debug({ timeout: config.waitForTimeout }, 'Waiting');
        await page.waitForTimeout(config.waitForTimeout);
      }

      if (debug) scraperLogger.debug({ count: Object.keys(config.selectors).length }, 'Extracting data from selectors');
      
      // Extract data using selectors
      const data: Record<string, any> = {};
      for (const [key, selector] of Object.entries(config.selectors)) {
        try {
          const elements = await page.$$(selector);
          if (elements.length === 0) {
            if (debug) scraperLogger.debug({ key, selector }, 'No elements found');
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
            
            if (debug) scraperLogger.debug({ key }, 'Found 1 element');
          } else {
            data[key] = await Promise.all(
              elements.map(el => el.textContent())
            );
            if (debug) scraperLogger.debug({ key, count: elements.length }, 'Found multiple elements');
          }
        } catch (err) {
          if (debug) scraperLogger.error({ key, selector, error: err instanceof Error ? err.message : String(err) }, 'Error extracting data');
          data[key] = null;
        }
      }

      // Take screenshot if requested
      let screenshotBase64: string | undefined;
      if (config.screenshot) {
        if (debug) scraperLogger.debug('Taking screenshot');
        const screenshot = await page.screenshot({ fullPage: true });
        screenshotBase64 = screenshot.toString('base64');
        if (debug) scraperLogger.debug({ size: screenshot.length }, 'Screenshot captured');
      }

      // Capture HTML source if requested
      let htmlSource: string | undefined;
      if (config.htmlSource) {
        if (debug) scraperLogger.debug('Capturing HTML source');
        htmlSource = await page.content();
        if (debug) scraperLogger.debug({ size: htmlSource.length }, 'HTML source captured');
      }

      await context.close();
      if (debug) scraperLogger.info({ url: page.url() }, 'Scraping completed successfully');

      return {
        success: true,
        data,
        screenshot: screenshotBase64,
        htmlSource,
        timestamp: startTime,
        url: config.url,
      };
    } catch (error) {
      scraperLogger.error({ error, url: config.url }, 'Error during scraping');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: startTime,
        url: config.url,
      };
    }
  }
}
