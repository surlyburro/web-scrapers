import express, { Request, Response } from 'express';
import { GenericScraper } from '../core/scraper';
import { ScraperConfigSchema } from '../types/scraper';
import { scraperConfigs } from '../scrapers';
import { apiLogger } from '../utils/logger';

const app = express();
app.use(express.json());

const scraper = new GenericScraper();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List available scrapers
app.get('/scrapers', (req: Request, res: Response) => {
  res.json({
    scrapers: Object.keys(scraperConfigs),
  });
});

// Run a predefined scraper by name
app.post('/scrape/:name', async (req: Request, res: Response) => {
  const { name } = req.params;
  const { debug, screenshot, htmlSource, ...params } = req.body;
  const config = scraperConfigs[name];

  apiLogger.info({ scraper: name, params }, 'Scrape request received');

  if (!config) {
    return res.status(404).json({ error: `Scraper '${name}' not found` });
  }

  // Check if URL parameters are required and provided
  if (config.urlParams && config.urlParams.length > 0) {
    const missingParams = config.urlParams.filter(param => !params[param]);
    if (missingParams.length > 0) {
      return res.status(400).json({ 
        error: `Missing required URL parameters: ${missingParams.join(', ')}` 
      });
    }
  }

  // Substitute URL parameters if present
  let url = config.url;
  if (config.urlParams) {
    for (const param of config.urlParams) {
      url = url.replace(`{${param}}`, params[param]);
    }
  }

  // Merge debug, screenshot, and htmlSource flags if provided
  const configWithOptions = {
    ...config,
    url,
    ...params, // Include all params so interactions can access them
    ...(debug !== undefined && { debug }),
    ...(screenshot !== undefined && { screenshot }),
    ...(htmlSource !== undefined && { htmlSource }),
  };

  try {
    const result = await scraper.scrape(configWithOptions);
    apiLogger.info({ scraper: name, success: result.success }, 'Scrape completed');
    res.json(result);
  } catch (error) {
    apiLogger.error({ scraper: name, error }, 'Scrape failed');
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Run a custom scraper with provided configuration
app.post('/scrape', async (req: Request, res: Response) => {
  apiLogger.info({ url: req.body.url }, 'Custom scrape request received');
  try {
    const config = ScraperConfigSchema.parse(req.body);
    const result = await scraper.scrape(config);
    apiLogger.info({ url: config.url, success: result.success }, 'Custom scrape completed');
    res.json(result);
  } catch (error) {
    apiLogger.error({ error }, 'Custom scrape failed');
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
});

export async function startServer(port: number = 3000): Promise<void> {
  await scraper.initialize();
  
  app.listen(port, () => {
    apiLogger.info({ port }, 'Scraper service started');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    apiLogger.info('SIGTERM received, closing scraper');
    await scraper.close();
    process.exit(0);
  });
}

export { app };
