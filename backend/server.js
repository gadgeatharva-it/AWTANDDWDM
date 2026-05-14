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

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');

const app = express();

// Security middleware
const corsOptions =
  process.env.NODE_ENV === 'production' && process.env.CLIENT_URL
    ? { origin: process.env.CLIENT_URL, credentials: true }
    : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);

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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection error:', err.message);
    process.exit(1);
  });
