#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Change to backend directory
process.chdir(path.join(__dirname, "backend"));

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
    console.log("=".repeat(80));
    console.log("SECURITY ALERT DETECTION TEST");
    console.log("=".repeat(80) + "\n");

    console.log("Step 1: Admin login");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      email: "vinayn@gmail.com",
      password: "Admin@123",
    });

    if (loginRes.status !== 200) {
      console.log(`❌ Login failed: ${loginRes.status}`);
      console.log(JSON.stringify(loginRes.body, null, 2));
      process.exit(1);
    }

    console.log("✓ Admin logged in\n");
    const jwt = loginRes.body.token;

    console.log("Step 2: Send SQL injection payload");
    console.log('Description: "\'; DROP TABLE users; --"');
    const threatRes = await makeRequest(
      "POST",
      "/api/bugs",
      {
        title: "Security Test Bug",
        description: "'; DROP TABLE users; --",
        priority: 1,
      },
      jwt,
    );

    console.log(`Response status: ${threatRes.status}`);
    if (threatRes.status >= 400) {
      console.log("✓ Request blocked as expected\n");
    }

    console.log("Step 3: Check database for security alerts");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const alerts = await prisma.securityAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`Found ${alerts.length} alert(s)\n`);

    if (alerts.length > 0) {
      console.log("Recent alerts:");
      alerts.forEach((alert, i) => {
        console.log(`\n${i + 1}. ${alert.type}`);
        console.log(`   Severity: ${alert.severity}`);
        console.log(`   Status: ${alert.status}`);
        console.log(`   Endpoint: ${alert.endpoint}`);
        console.log(`   IP: ${alert.ipAddress}`);
        console.log(`   Message: ${alert.message.substring(0, 80)}...`);
      });
    } else {
      console.log("❌ No alerts found in database!");
      console.log("This indicates threat detection is not working.\n");

      // Debug: Check if middleware is even running
      console.log("Debug: Checking request to any endpoint...");
      const healthRes = await makeRequest("GET", "/api/health", null);
      console.log(`Health check: ${healthRes.status}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
