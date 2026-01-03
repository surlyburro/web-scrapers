import { z } from 'zod';

export const InteractionSchema = z.object({
  type: z.enum(['fill', 'click', 'waitForNavigation', 'wait', 'waitForSelector', 'type', 'keyPress']),
  selector: z.string().optional(),
  value: z.string().optional(), // For 'fill' type, can use {param} placeholders
  paramName: z.string().optional(), // Parameter name to substitute into value
  duration: z.number().optional(), // For 'wait' type, milliseconds to wait
  key: z.string().optional(), // For 'keyPress' type, the key to press (e.g., 'Enter', 'ArrowDown')
});

export const ScraperConfigSchema = z.object({
  url: z.string(), // Can be a URL or a template with {param} placeholders
  urlParams: z.array(z.string()).optional(), // Required parameter names for URL template
  interactions: z.array(InteractionSchema).optional(), // Page interactions before scraping
  waitForSelector: z.string().optional(),
  waitForTimeout: z.number().optional(),
  selectors: z.record(z.string(), z.string()),
  screenshot: z.boolean().optional(),
  headless: z.boolean().optional(),
  navigationTimeout: z.number().optional(),
  debug: z.boolean().optional(),
  htmlSource: z.boolean().optional(),
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export interface ScraperResult {
  success: boolean;
  data?: Record<string, any>;
  screenshot?: string; // base64 encoded
  htmlSource?: string; // HTML source after page load
  error?: string;
  timestamp: string;
  url: string;
}
