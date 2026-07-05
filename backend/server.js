import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// CORS config (allow FRONTEND_URL from env, also allow *)
app.use(cors({
  origin: '*'
}));

// JSON body parser limit: 10mb
app.use(express.json({ limit: '10mb' }));

// Mount all routes at /api
app.use('/api', apiRoutes);

// Root GET / returns status
app.get('/', (req, res) => {
  res.json({ name: 'PlantMind API', version: '1.0.0', status: 'running' });
});

// Global error handler middleware at the end
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`PlantMind API server running on port ${PORT}`);
});
