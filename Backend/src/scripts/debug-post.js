const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:5001');
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;

    const payload = body ? JSON.stringify(body) : null;
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);

    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function main() {
  // Login as member
  const login = await req('POST', '/api/auth/login', { username: 'member', password: 'member123' });
  console.log('Login:', login.status);
  const token = login.body.token;

  // Test ticket creation
  console.log('\n--- POST /me/tickets ---');
  const ticket = await req('POST', '/api/me/tickets', { title: 'Test Ticket', message: 'Test message' }, token);
  console.log('Status:', ticket.status);
  console.log('Body:', JSON.stringify(ticket.body, null, 2));

  // Test progress creation
  console.log('\n--- POST /me/progress ---');
  const progress = await req('POST', '/api/me/progress', { weightKg: 75 }, token);
  console.log('Status:', progress.status);
  console.log('Body:', JSON.stringify(progress.body, null, 2));

  // Login as trainer
  const tLogin = await req('POST', '/api/auth/login', { username: 'trainer', password: 'trainer123' });
  const tToken = tLogin.body.token;

  // Test class creation
  console.log('\n--- POST /trainer/classes ---');
  const cls = await req(
    'POST',
    '/api/trainer/classes',
    { name: 'HIIT Class', durationMinutes: 45, description: 'Test' },
    tToken,
  );
  console.log('Status:', cls.status);
  console.log('Body:', JSON.stringify(cls.body, null, 2));

  // Test register
  console.log('\n--- POST /auth/register ---');
  const reg = await req('POST', '/api/auth/register', {
    name: 'Test User',
    username: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@test.local`,
    password: 'StrongPass1',
  });
  console.log('Status:', reg.status);
  console.log('Body:', JSON.stringify(reg.body, null, 2));

  // Test admin CRUD
  const aLogin = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  const aToken = aLogin.body.token;

  console.log('\n--- GET /admin/crud/User ---');
  const crudUser = await req('GET', '/api/admin/crud/User', null, aToken);
  console.log('Status:', crudUser.status);
  console.log('Body:', JSON.stringify(crudUser.body, null, 2).slice(0, 300));

  console.log('\n--- GET /admin/crud/users ---');
  const crudUsers = await req('GET', '/api/admin/crud/users', null, aToken);
  console.log('Status:', crudUsers.status);
  console.log('Body:', JSON.stringify(crudUsers.body, null, 2).slice(0, 300));
}

main().catch(console.error);
