const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration
const config = require('./config/env');
const { pool, connectDB } = require('./config/database');

const app = express();

// Middleware
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/attachments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files for uploads (with proper auth middleware)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make pool available to routes
app.locals.db = pool;

// Routes
const authRoutes = require('./routes/auth');
const formsRoutes = require('./routes/forms');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'PhD Research Tracking API is running!', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${config.CLIENT_URL}`);
});

module.exports = app; 