import dotenv from 'dotenv';
import path from 'path';

// Load env variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate critical config
if (!config.geminiApiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not set in your .env file. AI agents will fail to execute.');
}
