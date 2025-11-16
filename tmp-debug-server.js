
// tmp-debug-server.js — standalone debug server
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.json({ ok: true }));

app.post('/debug-token', async (req, res) => {
  const out = {
    env: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      NODE_ENV: process.env.NODE_ENV || null
    },
    parsed_project_id: null,
    token_ok: false,
    token_error: null,
    fake_eth_address: null,
    fake_btc_address: null,
  };

  const { userId='u1', coin='eth' } = req.body || {};
  const seed = `${userId}:${coin}`;
  const h = crypto.createHash('sha256').update(seed).digest('hex');
  out.fake_eth_address = '0x' + h.slice(0,40);
  out.fake_btc_address = 'bc1' + h.slice(0,30);

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    out.token_error = 'FIREBASE_SERVICE_ACCOUNT_JSON not set';
    return res.json(out);
  }

  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    out.parsed_project_id = parsed.project_id || null;
  } catch (e) {
    out.token_error = 'failed to parse SA JSON: ' + (e.message || e);
    return res.json(out);
  }

  try {
    const auth = new GoogleAuth({ credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON), scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    out.token_ok = !!token?.token;
    out.token_length = token?.token?.length || 0;
  } catch (e) {
    out.token_error = e && e.message ? e.message : String(e);
    out.token_stack = e && e.stack ? e.stack : undefined;
  }

  res.json(out);
});

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log('tmp-debug-server listening on', port));
