const fs = require('fs');
const path = require('path');

// Local dev convenience: load `backend/.env` if present.
// In Render (and most deployments), environment variables are provided by the platform.
const envPath = path.join(__dirname, '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require("express-rate-limit");

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const exportRoutes = require('./routes/export');
const aiRoutes = require('./routes/aiRoutes');
const { startEventReminderJob } = require('./jobs/eventReminderJob');

const app = express();

// Security middleware
function normalizeOrigin(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

const allowedOrigins =
  process.env.NODE_ENV === 'production' && process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(normalizeOrigin).filter(Boolean)
    : null;

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Allow non-browser requests (curl/postman) with no Origin header.
      if (!origin) return callback(null, true);

      if (!allowedOrigins) return callback(null, true);

      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    startEventReminderJob();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection error:', err.message);
    process.exit(1);
  });
