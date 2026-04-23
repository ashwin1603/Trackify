const http = require('http');

function login() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: 'example@mail.com', password: 'wrongpassword' });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Sending 6 login attempts...");
  for (let i = 1; i <= 6; i++) {
    const res = await login();
    console.log(`Attempt ${i}: Status ${res.status}, Response: ${res.body}`);
  }
}

run();
