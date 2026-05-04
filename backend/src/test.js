/**
 * Basic integration tests for the backend
 * Run with: node src/test.js
 * Requires: running backend + PostgreSQL with seeded data
 */

const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}`;

async function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.log(`  ✗ ${name}`);
      failed++;
    }
  }

  console.log('\n--- Health Check ---');
  const health = await fetchJSON(`${BASE}/health`);
  assert('Health endpoint returns 200', health.status === 200);
  assert('Health returns ok status', health.body.status === 'ok');

  console.log('\n--- Auth: Invalid Login ---');
  const loginFail = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: { username: 'wrong', password: 'wrong' },
  });
  assert('Invalid login returns 401', loginFail.status === 401);

  console.log('\n--- Auth: Admin Login ---');
  const adminLogin = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });
  assert('Admin login returns 200', adminLogin.status === 200);
  assert('Admin login returns token', !!adminLogin.body.token);
  assert('Admin has admin role', adminLogin.body.user?.role === 'admin');

  console.log('\n--- Auth: Student Login ---');
  const studentLogin = await fetchJSON(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: { username: 'john', password: 'password123' },
  });
  assert('Student login returns 200', studentLogin.status === 200);
  assert('Student login returns token', !!studentLogin.body.token);
  assert('Student has student role', studentLogin.body.user?.role === 'student');

  const token = studentLogin.body.token;

  console.log('\n--- Grades (Student) ---');
  const grades = await fetchJSON(`${BASE}/api/grades`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert('Grades returns 200', grades.status === 200);
  assert('Grades has GPA', typeof grades.body.gpa === 'number');

  console.log('\n--- Metrics ---');
  const metrics = await fetchJSON(`${BASE}/metrics`);
  assert('Metrics endpoint returns 200', metrics.status === 200);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
