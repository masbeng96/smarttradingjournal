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

// Proxy for MT5 REST API endpoint (avoids mixed content & CORS issues on HTTPS web)
app.get('/api/mt5/account', async (req, res) => {
  try {
    const mt5Res = await fetch('http://202.155.94.173/api/account/1', {
      headers: {
        'x-api-key': 'TokenRahasia2026',
        'Accept': 'application/json'
      }
    });
    if (!mt5Res.ok) {
      return res.status(mt5Res.status).json({ error: 'MT5 Server returned ' + mt5Res.status });
    }
    const data = await mt5Res.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to connect to MT5 endpoint: ' + (err.message || err) });
  }
});

app.get('/api/account/:id', async (req, res) => {
  try {
    const accountId = req.params.id || '1';
    const mt5Res = await fetch(`http://202.155.94.173/api/account/${accountId}`, {
      headers: {
        'x-api-key': 'TokenRahasia2026',
        'Accept': 'application/json'
      }
    });
    if (!mt5Res.ok) {
      return res.status(mt5Res.status).json({ error: 'MT5 Server returned ' + mt5Res.status });
    }
    const data = await mt5Res.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to connect to MT5 endpoint: ' + (err.message || err) });
  }
});

// Forex Factory Economic Calendar proxy endpoints
app.get('/api/calendar/thisweek', async (req, res) => {
  try {
    const ffRes = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!ffRes.ok) {
      return res.status(ffRes.status).json({ error: 'Forex Factory server returned ' + ffRes.status });
    }
    const data = await ffRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch Forex Factory calendar: ' + (err.message || err) });
  }
});

app.get('/api/calendar/nextweek', async (req, res) => {
  try {
    const ffRes = await fetch('https://nfs.faireconomy.media/ff_calendar_nextweek.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!ffRes.ok) {
      return res.status(ffRes.status).json({ error: 'Forex Factory server returned ' + ffRes.status });
    }
    const data = await ffRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch Forex Factory calendar: ' + (err.message || err) });
  }
});

// Catch-all handler for SPA navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Trading Journal Server running on port ${PORT}`);
});
