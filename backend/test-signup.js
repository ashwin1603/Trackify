const http = require("http");

const data = JSON.stringify({
  name: "Aaryan Test",
  email: "aaryan@example.com",
  password: "Security@123",
  roleName: "DEVELOPER",
  dob: "2005-08-12"
});

const req = http.request({
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/signup",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length
  }
}, (res) => {
  let body = "";
  res.on("data", d => body += d);
  res.on("end", () => console.log(`Status: ${res.statusCode}\nBody: ${body}`));
});

req.on("error", console.error);
req.write(data);
req.end();
