const mongoose = require('mongoose');

const connectDatabase = async (logger) => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }
  
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  };
  
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected to:', mongoUri.split('@')[1] || 'localhost');
  });
  
  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });
  
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  
  try {
    await mongoose.connect(mongoUri, options);
    return mongoose.connection;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
};

module.exports = { connectDatabase };