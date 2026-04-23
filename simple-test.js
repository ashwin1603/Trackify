const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function makeRequest(method, path, body = null, jwt = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "dev-api-key-secure-bug-tracker-2026",
      },
    };

    if (jwt) {
      options.headers["Authorization"] = `Bearer ${jwt}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log("Starting server...\n");

    // Give server time to start if needed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Login as admin
    console.log("1. Admin login...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      email: "vinayn@gmail.com",
      password: "Admin@123",
    });

    if (loginRes.status !== 200) {
      console.log(`Login failed: ${loginRes.status}`);
      console.log(JSON.stringify(loginRes.body, null, 2));
      process.exit(1);
    }

    const jwt = loginRes.body.token;
    console.log("✓ Logged in\n");

    // Send SQL injection payload
    console.log("2. Sending SQL injection payload...");
    const threatRes = await makeRequest(
      "POST",
      "/api/bugs",
      {
        title: "Test Bug",
        description: "'; DROP TABLE users; --",
        priority: 1,
      },
      jwt,
    );

    console.log(`Response status: ${threatRes.status}`);
    console.log(
      `Response: ${JSON.stringify(threatRes.body).substring(0, 100)}...\n`,
    );

    // Wait a moment for alert processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check database for alerts
    console.log("3. Checking database for alerts...");
    const alerts = await prisma.securityAlert.findMany();
    console.log(`Alerts in database: ${alerts.length}`);

    if (alerts.length > 0) {
      console.log("\nAlerts:");
      alerts.forEach((a, i) => {
        console.log(`\n${i + 1}. ${a.type}`);
        console.log(`   Severity: ${a.severity}`);
        console.log(`   Status: ${a.status}`);
        console.log(`   Endpoint: ${a.endpoint}`);
        console.log(`   Message: ${a.message}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

test();
