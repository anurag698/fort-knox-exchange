// src/app/seed-data/page.tsx
import React from "react";

/**
 * Admin / Setup page for debugging environment variables.
 * - Shows presence and length of important server env vars (no secret values printed).
 * - Provides copy-paste instructions for Firebase Studio and local .env.
 *
 * Paste this file and visit /seed-data after restarting your preview server.
 */

const safe = (v: string | undefined) => (!!v ? true : false);

export default function SeedDataPage() {
  const envReport = {
    NODE_ENV: process.env.NODE_ENV ?? null,
    NEXT_PUBLIC_BASE_URL: safe(process.env.NEXT_PUBLIC_BASE_URL),
    ETH_XPUB_present: safe(process.env.ETH_XPUB),
    ETH_XPUB_len: process.env.ETH_XPUB ? String(process.env.ETH_XPUB.length) : "0",
    ETH_NETWORK_RPC_present: safe(process.env.ETH_NETWORK_RPC),
    FIREBASE_SERVICE_ACCOUNT_JSON_present: safe(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    FIREBASE_SERVICE_ACCOUNT_JSON_len: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length) : "0",
    GOOGLE_APPLICATION_CREDENTIALS_present: safe(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial", padding: 28 }}>
      <h1 style={{ marginBottom: 8 }}>Seed / Admin — Environment Debug</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        This page is a server-side diagnostic. It shows <strong>presence</strong> (true/false) and safe length info for
        important server environment variables. It does <strong>not</strong> print secret values.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Current server environment (safe)</h2>
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 980 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: "8px 6px" }}>Key</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: "8px 6px" }}>Value (safe)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(envReport).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "8px 6px", borderBottom: "1px solid #fafafa", width: 320 }}>{k}</td>
                <td style={{ padding: "8px 6px", borderBottom: "1px solid #fafafa", color: typeof v === "string" && v === "0" ? "#A00" : "#111" }}>
                  {String(v)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Why this matters</h2>
        <p style={{ color: "#444" }}>
          The deposit-address API requires:
        </p>
        <ul>
          <li><strong>FIREBASE_SERVICE_ACCOUNT_JSON</strong> — server admin credentials to access Firestore (stringified JSON).</li>
          <li><strong>ETH_XPUB</strong> — extended public key used to derive deterministic ETH deposit addresses.</li>
          <li><strong>ETH_NETWORK_RPC</strong> — an Ethereum RPC endpoint (Alchemy/Infura/QuickNode).</li>
        </ul>
        <p style={{ color: "#444" }}>
          If any are missing the server will abort and return a 500. The table above shows which keys are visible to the running server.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>How to fix (Firebase Studio preview)</h2>
        <ol>
          <li>Open <strong>Firebase Studio</strong> → Workspace → <strong>Environment</strong> or <strong>Environment / Variables</strong>.</li>
          <li>Click <strong>Add variable</strong> and add these variables (case-sensitive):
            <ul>
              <li><code>FIREBASE_SERVICE_ACCOUNT_JSON</code> — the entire JSON from Firebase service account (stringified).</li>
              <li><code>ETH_XPUB</code> — your ETH xpub string (starts with <code>xpub</code>).</li>
              <li><code>ETH_NETWORK_RPC</code> — your RPC URL (Alchemy/Infura/QuickNode).</li>
              <li>(optional) <code>NEXT_PUBLIC_BASE_URL</code> — e.g. <code>http://localhost:3000</code>.</li>
            </ul>
          </li>
          <li><strong>IMPORTANT:</strong> if Firebase Studio rejects multiline values, convert your service account JSON to a single-line escaped JSON (see commands below).</li>
          <li>Save the environment variables <strong>and then STOP and START the preview</strong>. Restart is required for envs to load.</li>
          <li>Visit <code>/seed-data</code> again and confirm the keys show <code>true</code> (FIREBASE_SERVICE_ACCOUNT_JSON and ETH_XPUB must be true).</li>
        </ol>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Commands to produce single-line JSON (run locally)</h2>
        <p style={{ color: "#444" }}>
          If you have the service account file <code>serviceAccountKey.json</code>, run one of these in your terminal and paste the full stdout into Studio:
        </p>
        <pre style={{ background: "#fafafa", padding: 12, borderRadius: 6, overflowX: "auto" }}>
{`# Node:
node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('./serviceAccountKey.json','utf8')); console.log(JSON.stringify(j));"

# Python:
python -c "import json;print(json.dumps(json.load(open('serviceAccountKey.json'))))"
`}
        </pre>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Quick local .env example (for local dev)</h2>
        <pre style={{ background: "#fafafa", padding: 12, borderRadius: 6, overflowX: "auto" }}>
{`# .env (do NOT commit)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ETH_XPUB=xpub6CYourXpubHere
ETH_NETWORK_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}'
`}
        </pre>
        <p style={{ color: "#666" }}>
          Then <code>npm run dev</code> (or <code>pnpm dev</code>) to verify locally.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>If this still fails</h2>
        <p style={{ color: "#444" }}>
          1. After adding variables and restarting preview, paste the exact JSON shown on this page here (or paste the output of <code>curl http://localhost:3000/api/_admin_debug</code>).<br/>
          2. If Firebase Studio won’t accept the value, run the node/python command above, copy stdout and paste that exact string as the value.
        </p>
      </section>

      <footer style={{ color: "#888", fontSize: 13 }}>
        <strong>Security note:</strong> Do not commit service account JSON or .env to git. Use .gitignore and production secrets manager for production.
      </footer>
    </div>
  );
}
