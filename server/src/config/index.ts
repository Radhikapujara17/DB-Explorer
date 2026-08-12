import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEFAULT_MONGO_URI: process.env.DEFAULT_MONGO_URI || 'mongodb://localhost:27017'
};
