import express from 'express';
import cors from 'cors';
import { URLSearchParams } from 'url';
import 'dotenv/config';

const app = express();
app.use(cors());

const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.VITE_REDIRECT_URI;

app.get('/exchange', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      body: params,
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 3001; // A different port from your Vite dev server
app.listen(port, () => {
  console.log(`Token exchange server listening on http://localhost:${port}`);
});