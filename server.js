import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for web and native Capacitor apps
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// Proxy for MT5 REST API endpoints (accounts 1 and 2)
app.get(['/api/mt5/account/:id?', '/api/account/:id?'], async (req, res) => {
  const accountId = req.params.id || '1';
  
  const endpoints = [
    `http://202.155.94.173/api/account/${accountId}`,
    `http://202.155.94.173:8080/api/account/${accountId}`
  ];

  for (const endpoint of endpoints) {
    try {
      const mt5Res = await fetch(endpoint, {
        headers: {
          'x-api-key': 'TokenRahasia2026',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (mt5Res.ok) {
        const data = await mt5Res.json();
        return res.status(200).json({
          ...data,
          isConnected: true,
        });
      }
    } catch (err) {
      console.log(`Failed to fetch from ${endpoint}:`, err.message);
      // Continue to next endpoint
    }
  }

  // If all endpoints failed
  return res.status(200).json({ 
    akun: `Akun ${accountId}`,
    balance: 0,
    equity: 0,
    margin: 0,
    floating_pnl: 0,
    isConnected: false,
    error: `Server MT5 HTTP Error / Unreachable`
  });
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
