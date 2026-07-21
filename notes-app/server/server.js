const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// 🔴 CRITICAL: Load environment variables FIRST, before any imports!
dotenv.config();

// Now import modules AFTER dotenv.config()
const connectDB = require("./config/db");
const noteRoutes = require("./routes/noteRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helmet-like security headers (manual implementation)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// 🔒 SECURED Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log only method and URL
  const logMessage = `${req.method} ${req.url}`;
  
  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Color code based on status
    let statusEmoji = '✅';
    if (statusCode >= 400) statusEmoji = '⚠️';
    if (statusCode >= 500) statusEmoji = '❌';
    
    console.log(`${statusEmoji} ${logMessage} - ${statusCode} (${duration}ms)`);
  });
  
  next();
});

// ============ ROUTES ============

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Notes API",
    version: "2.0.0",
    documentation: "/api-docs",
  });
});

// Health check route (no sensitive info)
app.get("/health", (req, res) => {
  const dbState = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = mongoose.connection.readyState;

  res.json({
    success: true,
    status: state === 1 ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    // Only show DB status in development
    ...(process.env.NODE_ENV === 'development' && {
      database: {
        state: dbState[state],
        host: mongoose.connection.host || "Not connected",
      },
      uptime: process.uptime(),
    }),
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);

// ============ ERROR HANDLERS ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// 🔒 SECURED Global error handler
app.use((err, req, res, next) => {
  // Log error without stack trace in production
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ Error: ${err.message}`);
    console.error('Stack:', err.stack);
  } else {
    console.error(`❌ Server error occurred`);
  }
  
  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      ...(process.env.NODE_ENV === 'development' && { errors: messages }),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired",
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry. Please try again.",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : "Internal server error. Please try again later.",
    // Never send stack trace to client
  });
});

// ============ SERVER STARTUP ============

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Server Status: Running');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: Connected`);
      console.log(`🔐 Authentication: Enabled`);
      console.log('='.repeat(50) + '\n');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err.message);
      // Close server gracefully
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err.message);
      // Close server gracefully
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('❌ Failed to start server');
    console.error('Reason:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️ SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

startServer();