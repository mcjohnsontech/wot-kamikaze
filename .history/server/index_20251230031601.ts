import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import whatsappRouter from './routes/whatsapp.js';
import otpRouter from './routes/otp.js';
import formsRouter from './routes/forms.js';
import csvRouter from './routes/csv.js';
import whatsappConfigRouter from './routes/whatsappConfig.js';
import { startOtpCleanupSchedule } from './services/otpCleanup.js';
import { startRateLimitStoreCleanup } from './middleware/rateLimiter.js';
dotenv.config({ path: './server/.env' });

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env and root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Increase the limit for JSON bodies (since you're sending the CSV as a string/JSON)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware - CORS
const defaultLocalOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const envFrontend = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
const envFrontendsList = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(u => u.trim()).filter(Boolean) : [];
const allowedOrigins = Array.from(new Set([...
  envFrontend,
  ...envFrontendsList,
  ...defaultLocalOrigins,
]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-sme-id'],
  credentials: true,
  preflightContinue: false,
}));

// Warn if FRONTEND_URL not set in production
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL && !process.env.FRONTEND_URLS) {
  console.warn('⚠️  FRONTEND_URL or FRONTEND_URLS is not set. CORS will fall back to localhost origins.');
}
// Runtime environment guidance
if (process.env.NODE_ENV === 'production') {
  if (!process.env.VITE_API_URL && !process.env.API_URL && !process.env.BACKEND_URL) {
    console.warn('⚠️  VITE_API_URL (frontend -> backend) is not set. Ensure your frontend has VITE_API_URL pointing to this backend.');
  }
  if (!process.env.FRONTEND_URL && !process.env.FRONTEND_URLS) {
    console.warn('⚠️  FRONTEND_URL or FRONTEND_URLS is not set on the backend. Add FRONTEND_URL (single) or FRONTEND_URLS (comma-separated) to enable CORS for your frontend domain(s).');
  }
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api', whatsappRouter);
app.use('/api', whatsappConfigRouter);
app.use('/api', otpRouter);
app.use('/api', formsRouter);
app.use('/api', csvRouter);

// Start background services
const otpCleanupInterval = parseInt(process.env.OTP_CLEANUP_INTERVAL_MINUTES || '60', 10);
startOtpCleanupSchedule(otpCleanupInterval);
startRateLimitStoreCleanup(60000); // Clean up rate limit store every minute

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  void _next;
  const message = process.env.NODE_ENV === 'development'
    ? (err instanceof Error ? err.message : String(err))
    : undefined;

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WOT Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`💬 Twilio WhatsApp: ${process.env.TWILIO_WHATSAPP_NUMBER || 'Not configured'}`);
  console.log(`🧹 OTP Cleanup running every ${otpCleanupInterval} minutes`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
