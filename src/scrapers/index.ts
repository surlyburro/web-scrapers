import { ScraperConfig } from '../types/scraper';
import { exampleConfigs } from './example/example';
import { wundergroundConfigs } from './wunderground/wunderground';
import { alamedaJuryConfigs } from './alameda-jury/alameda-jury';

// Aggregate all scraper configurations from site-specific directories
export const scraperConfigs: Record<string, ScraperConfig> = {
  ...exampleConfigs,
  ...wundergroundConfigs,
  ...alamedaJuryConfigs,
};
