const https = require("https");
const http = require("http");

const CONFIG = {
  url: "https://hanxes-2.vercel.app/api/cron/process-scheduled",
  token: "9da630f338abe1e6468653c151bcb0fc",
  intervalMs: 60 * 1000, // 1 minute
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

    res.on("data", (chunk) => {
      data += chunk;
    });

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

// Dummy HTTP server — required for Render Web Service to stay alive
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Cron scheduler is running ✅");
}).listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

// Fire immediately on start, then every minute
console.log(`🚀 Cron scheduler started — hitting every 60 seconds`);
console.log(`   URL   : ${CONFIG.url}`);
console.log(`   Token : ${CONFIG.token.slice(0, 6)}...${CONFIG.token.slice(-4)}\n`);

hitEndpoint();
setInterval(hitEndpoint, CONFIG.intervalMs);
