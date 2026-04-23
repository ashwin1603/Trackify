const http = require("http");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/health",
  method: "GET",
  headers: {
    "X-API-Key": "dev-api-key-secure-bug-tracker-2026",
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("Response:", data);
    process.exit(0);
  });
});

req.on("error", (error) => {
  console.error("Connection error:", error.message);
  process.exit(1);
});

req.end();
