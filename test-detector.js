const OwaspDetector = require("./backend/src/utils/owaspDetector");

const testReq = {
  method: "POST",
  path: "/api/bugs",
  url: "/api/bugs",
  body: {
    title: "Test",
    description: "'; DROP TABLE users; --",
  },
  headers: {},
  query: {},
  params: {},
  ip: "127.0.0.1",
  user: { id: "123", role: "admin" },
};

const threats = OwaspDetector.analyzeRequest(testReq);
console.log("Threats detected:", threats.length);
threats.forEach((t) => {
  console.log(`  - ${t.type} (${t.severity}): ${t.message}`);
});
