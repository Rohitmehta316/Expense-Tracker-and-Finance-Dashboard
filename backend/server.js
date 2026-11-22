import './src/config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import api from './src/routes/index.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'https://expense-tracker-and-finance-dashboard-1.onrender.com',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api', api);

app.use((err, _req, res, _next) => {
  const databaseUnavailable =
    ['MongooseServerSelectionError', 'MongoNetworkError'].includes(err.name) ||
    (err.name === 'MongooseError' && /buffering timed out/i.test(err.message));
  const status =
    err.status ||
    (databaseUnavailable
      ? 503
      : err.name === 'ValidationError'
        ? 400
        : err.code === 11000
          ? 409
          : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    message:
      status === 503
        ? 'Database is temporarily unavailable. Please try again shortly.'
        : status === 500
          ? 'Something went wrong.'
          : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

const start = async () => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET are required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`FinTrack API listening on ${port}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}
