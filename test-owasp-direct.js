// This script simulates what happens when the OWASP middleware receives the SQL injection payload

const OwaspDetector = require("./backend/src/utils/owaspDetector");

// Simulate the request object as it would appear in the middleware
const mockRequest = {
  method: "POST",
  path: "/api/bugs",
  url: "/api/bugs",
  query: {},
  params: {},
  headers: {
    "content-type": "application/json",
    "x-api-key": "dev-api-key-secure-bug-tracker-2026",
    authorization: "Bearer fake.token.here",
  },
  body: {
    title: "Security Test Bug",
    description: "'; DROP TABLE users; --",
    priority: 1,
  },
  ip: "127.0.0.1",
  user: { id: "user-123", name: "Test User" },
};

console.log("=".repeat(80));
console.log("SIMULATING OWASP DETECTION");
console.log("=".repeat(80));

console.log("\nRequest details:");
console.log(`  Method: ${mockRequest.method}`);
console.log(`  Path: ${mockRequest.path}`);
console.log(`  Body:`, JSON.stringify(mockRequest.body, null, 2));

console.log("\nRunning threat detection...\n");
const threats = OwaspDetector.analyzeRequest(mockRequest);

console.log(`Threats detected: ${threats.length}\n`);

if (threats.length > 0) {
  threats.forEach((threat, i) => {
    console.log(`${i + 1}. ${threat.type}`);
    console.log(`   Severity: ${threat.severity}`);
    console.log(`   Category: ${threat.category}`);
    console.log(`   Message: ${threat.message}`);
  });
} else {
  console.log("❌ NO THREATS DETECTED - This is unexpected!");
  console.log("\nDebugging: Let's check individual inputs...");

  // Test each input separately
  const testInputs = {
    body_json: JSON.stringify(mockRequest.body),
    title: mockRequest.body.title,
    description: mockRequest.body.description,
    priority: mockRequest.body.priority,
  };

  for (const [key, value] of Object.entries(testInputs)) {
    const sqlCheck = OwaspDetector.detectSQLInjection(value);
    const xssCheck = OwaspDetector.detectXSS(value);

    if (sqlCheck || xssCheck) {
      console.log(`\n${key}: ${value}`);
      if (sqlCheck) console.log(`  - SQL Injection: ${sqlCheck.message}`);
      if (xssCheck) console.log(`  - XSS: ${xssCheck.message}`);
    }
  }
}

console.log("\n" + "=".repeat(80));
