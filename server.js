import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Enable JSON parsing
app.use(express.json());

// Serve static assets from Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Cloud Run
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// App version check API for Live Android OTA Auto-Updater
app.get('/api/version', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'version.json'));
});

// Catch-all handler for SPA navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Trading Journal Server running on port ${PORT}`);
});
