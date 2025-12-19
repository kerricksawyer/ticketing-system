const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase();

// Routes
app.use('/api/shows', require('./routes/shows'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
