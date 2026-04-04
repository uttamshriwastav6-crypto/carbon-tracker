
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emissionRoutes from './routes/emissions.js';
import transportRoutes from './routes/transport.js';
import goalRoutes from './routes/goals.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes mounted at root to fulfill /api/parse-sms directly from the router
app.use('/', emissionRoutes);
app.use('/', transportRoutes);
app.use(goalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌍 Carbon Tracker API running on http://localhost:${PORT}`);
});
