const https = require("https");
const http = require("http");

const CONFIG = {
  url: "https://hanxes-2.vercel.app/api/cron/process-scheduled",
  token: "9da630f338abe1e6468653c151bcb0fc",
  intervalMs: 60 * 1000,
};

function getTimestamp() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function hitEndpoint() {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] ⏱  Firing cron request...`);

  const urlObj = new URL(CONFIG.url);
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    method: "GET",
    headers: {
      Authorization: `Bearer ${CONFIG.token}`,
      "Content-Type": "application/json",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      const now = getTimestamp();
      console.log(`[${now}] ✅ Response: ${res.statusCode} — ${data.trim()}`);
    });
  });

  req.on("error", (err) => {
    const now = getTimestamp();
    console.error(`[${now}] ❌ Request failed: ${err.message}`);
  });

  req.end();
}

// Self-ping to prevent Render free tier spin-down (every 10 mins)
function selfPing(appUrl) {
  https.get(appUrl, (res) => {
    console.log(`[${getTimestamp()}] 🔁 Self-ping: ${res.statusCode}`);
  }).on("error", (err) => {
    console.error(`[${getTimestamp()}] Self-ping failed: ${err.message}`);
  });
}

const PORT = process.env.PORT || 3001;
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Cron scheduler is running ✅");
}).listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);

  // Start self-ping after server is ready — using Render's public URL
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    setInterval(() => selfPing(RENDER_URL), 10 * 60 * 1000); // every 10 mins
  }
});

console.log(`🚀 Cron scheduler started — hitting every 60 seconds`);
console.log(`   URL   : ${CONFIG.url}`);
console.log(`   Token : ${CONFIG.token.slice(0, 6)}...${CONFIG.token.slice(-4)}\n`);

hitEndpoint();
setInterval(hitEndpoint, CONFIG.intervalMs);
