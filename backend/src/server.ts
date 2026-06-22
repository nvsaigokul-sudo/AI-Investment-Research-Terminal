import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDb } from './db/connection';
import apiRouter from './routes/api';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start Server
async function startServer() {
  try {
    console.log('Initializing backend server...');
    // Initialize database schema/client
    await initDb();
    
    app.listen(config.port, () => {
      console.log(`Server successfully started on port ${config.port}`);
      console.log(`API endpoints accessible at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();
