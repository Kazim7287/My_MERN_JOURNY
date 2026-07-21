const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    // Validate that we have a connection string
    if (!mongoURI) {
      console.error("❌ Database connection string not configured");
      process.exit(1);
    }

    // 🔒 Hide credentials in logs
    const sanitizedURI = mongoURI.replace(
      /\/\/([^:]+):([^@]+)@/,
      '//***:***@'
    );
    
    console.log(`🔄 Connecting to database...`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📍 ${sanitizedURI}`);
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ Database connected`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Host: ${conn.connection.host}`);
      console.log(`📚 Database: ${conn.connection.name}`);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ Database connection error');
      if (process.env.NODE_ENV === 'development') {
        console.error('Details:', err.message);
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ Database reconnected');
    });

    return conn;
  } catch (error) {
    console.error("❌ Database connection failed");
    if (process.env.NODE_ENV === 'development') {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
};

module.exports = connectDB;