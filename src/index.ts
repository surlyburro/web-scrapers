import { startServer } from './api/server';

const PORT = parseInt(process.env.PORT || '3000', 10);

startServer(PORT).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
