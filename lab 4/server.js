const express = require('express');
const { initializeDB } = require('./database/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// CORS configuration to allow local testing and frontend interaction
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root endpoint for quick verification
app.get('/', (req, res) => {
  res.json({
    project: 'Lab 4 – Registration, Login and JWT',
    author: 'T.SHASHANK',
    reg_no: '252U1R1243',
    section: 'CSE-2E(211)',
    status: 'Running',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
    },
  });
});

// Authentication routes
app.use('/', authRoutes);

// 404 Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

/**
 * Initializes Database and Starts the Express Server
 */
const startServer = async () => {
  try {
    await initializeDB();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`Server running successfully at http://localhost:${PORT}/`);
      console.log(`Registration endpoint: POST http://localhost:${PORT}/register`);
      console.log(`Login endpoint:        POST http://localhost:${PORT}/login`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Start the application only if directly executed
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
