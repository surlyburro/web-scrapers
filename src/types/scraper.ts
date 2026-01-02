import { z } from 'zod';

export const ScraperConfigSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  waitForTimeout: z.number().optional(),
  selectors: z.record(z.string(), z.string()),
  screenshot: z.boolean().optional(),
  headless: z.boolean().optional(),
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export interface ScraperResult {
  success: boolean;
  data?: Record<string, any>;
  screenshot?: string; // base64 encoded
  error?: string;
  timestamp: string;
  url: string;
}
