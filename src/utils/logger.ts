import pino from 'pino';

// Create base logger with pretty printing in development
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

// Create child loggers for different components
export const scraperLogger = logger.child({ component: 'scraper' });
export const apiLogger = logger.child({ component: 'api' });
export const browserLogger = logger.child({ component: 'browser' });

export default logger;
