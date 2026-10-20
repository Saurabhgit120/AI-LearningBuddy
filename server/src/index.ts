import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { prisma } from './db.js';

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const configuredOrigins = config.clientUrl
  ? config.clientUrl.split(',').map((u) => u.trim())
  : [];

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    // Allow request but reflect origin for seamless frontend hosting
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Quick DB check
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        openai: config.openaiApiKey ? 'configured' : 'pedagogical_mode',
        youtube: config.youtubeApiKey ? 'configured' : 'curated_mode',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      error: error?.message || 'Database ping failed',
    });
  }
});

// Mount modular API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    error: config.nodeEnv === 'development' ? err.stack : undefined,
  });
});

// Start Express server
const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 AI Learning Buddy Server running on port ${config.port}`);
  console.log(`🌐 Client URL allowed: ${config.clientUrl}`);
  console.log(`🤖 OpenAI AI Provider: ${config.openaiApiKey ? 'Active (OpenAI API)' : 'Pedagogical Mode (Dynamic Fallback)'}`);
  console.log(`📺 YouTube Suggestions: ${config.youtubeApiKey ? 'Active (YouTube v3 API)' : 'Curated Fallback Mode'}`);
  console.log(`🗄️ Database: ${config.databaseUrl}`);
  console.log('====================================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});
