const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');

const placesRouter = require('./routes/places');
const planRouter = require('./routes/plan');
const askAiRouter = require('./routes/askAi');
const postsRouter = require('./routes/posts');
const questionsRouter = require('./routes/questions');
const profileRouter = require('./routes/profile');
const notificationsRouter = require('./routes/notifications');
const translateRouter = require('./routes/translate');
const reportRouter = require('./routes/report');

const app = express();

// CORS configuration (allow frontend origin, plus localhost/dev tools)
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly fallback
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiters for AI and posting endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI requests. Please wait a moment / ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ.' }
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Posting rate limit exceeded. Please try again shortly.' }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Namma Trip API',
    version: '1.0.0',
    districts_covered: 31,
    places_count: 84
  });
});

// Direct feed alias route as specified in requirements (GET /api/feed)
app.get('/api/feed', (req, res) => {
  const db = require('./data/db');
  const posts = db.posts.getAll({ currentUserId: req.query.currentUserId || 'demo-user-id' });
  res.json({ success: true, count: posts.length, posts });
});

// Mount Routes
app.use('/api/places', placesRouter);
app.use('/api/plan', aiLimiter, planRouter);
app.use('/api/ask-ai', aiLimiter, askAiRouter);
app.use('/api/translate', aiLimiter, translateRouter);
app.use('/api/posts', postLimiter, postsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/report', reportRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 Namma Trip Backend running on port ${env.PORT}`);
    console.log(`📍 Places dataset: 84 places, covering all 31 districts of Karnataka`);
  });
}

module.exports = app;
