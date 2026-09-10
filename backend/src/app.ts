import express from 'express';
import cors from 'cors';
import ticketsRouter from './routes/tickets.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check — handy for Docker/monitoring.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/tickets', ticketsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
