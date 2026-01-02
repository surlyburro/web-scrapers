import express, { Request, Response } from 'express';
import { GenericScraper } from '../core/scraper';
import { ScraperConfigSchema } from '../types/scraper';
import { scraperConfigs } from '../scrapers';

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
  const { debug } = req.body;
  const config = scraperConfigs[name];

  if (!config) {
    return res.status(404).json({ error: `Scraper '${name}' not found` });
  }

  // Merge debug flag if provided
  const configWithDebug = debug !== undefined ? { ...config, debug } : config;

  try {
    const result = await scraper.scrape(configWithDebug);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Run a custom scraper with provided configuration
app.post('/scrape', async (req: Request, res: Response) => {
  try {
    const config = ScraperConfigSchema.parse(req.body);
    const result = await scraper.scrape(config);
    res.json(result);
  } catch (error) {
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
    console.log(`Scraper service listening on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing scraper...');
    await scraper.close();
    process.exit(0);
  });
}

export { app };
