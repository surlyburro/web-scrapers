import { startServer } from './api/server';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

startServer(PORT).catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
