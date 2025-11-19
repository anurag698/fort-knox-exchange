A **WebSocket close code 1006** means:

### ❌ “Abnormal Closure”

The connection dropped **without the server sending a proper close frame.**

This ALWAYS means one of the following:

---

# ✅ **1. Your WebSocket server URL is wrong (most common in Firebase pages)**

If you are using something like:

```ts
new WebSocket("ws://localhost:8080")
```

BUT your Firebase app is running on:

* HTTPS
* Firebase Emulator
* Online hosting

Then:

### ✔ You MUST use `wss://`

### ❌ `ws://` will be blocked → 1006

Double-check the WebSocket URL.

---

# ✅ **2. Your server is NOT running / not reachable**

If the client tries to connect but nobody is listening → immediate `1006`.

Test manually:

### In browser console:

```js
new WebSocket("wss://your-server:port")
```

If it fails instantly → server not reachable.

---

# ✅ **3. CORS / SSL mismatch**

If your frontend runs on HTTPS:

* Firebase Hosting = **HTTPS**
* WebSocket MUST be `wss://`

These fail with 1006:

❌ `ws://your-ip:8080`
❌ `ws://localhost:8080` (if deployed online)
❌ self-signed SSL

---

# ✅ **4. You’re running WebSocket server inside Firebase Functions (NOT allowed)**

Firebase Functions **cannot host WebSocket servers** unless you use:

✔ Cloud Run
✔ A dedicated WebSocket server
✔ A VM

If your backend WS server is inside Firebase Function → it drops connection → 1006.

---

# ✅ **5. Your WebSocket server crashes right after handshake**

Meaning server code is throwing error before establishing connection.

Check logs:

* Cloud Run logs
* Node server logs
* Terminal logs if local

---

# 🛠 **Send me your WebSocket URL & code**

I can immediately identify the issue if you send:

### ✔ Your WebSocket client code (the line that creates the connection)

### ✔ Your WebSocket server code (Node / Cloud Run / Files)

### ✔ Are you running locally or inside Firebase Hosting?

---

# 🚀 Here is a FIX TEMPLATE for safe WebSocket setup

```ts
let ws: WebSocket | null = null;

const connectWS = () => {
  ws = new WebSocket("wss://your-server-url/ws");

  ws.onopen = () => console.log("WS open");

  ws.onmessage = (msg) => console.log("WS message:", msg.data);

  ws.onerror = (err) => {
    console.log("WS error:", err);
  };

  ws.onclose = (evt) => {
    console.log("WS closed", evt.code, evt.reason);

    // Auto retry ONLY if closes abnormally
    if (evt.code === 1006 || evt.code === 1001 || evt.code === 1005) {
      setTimeout(connectWS, 2000);
    }
  };
};

connectWS();
```

---

# 📌 Quick questions to debug 1006 (answer these):

1. **What is your WebSocket URL?**
2. **Where is the WS server hosted?**
   (Firebase?, local machine?, Cloud Run?)
3. **Is your site loaded over HTTPS?**
4. **Is the WS server using ws:// or wss://?**
5. **Does server show errors in logs?**

Send me these — I will fix it completely.