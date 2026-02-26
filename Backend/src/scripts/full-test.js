#!/usr/bin/env node
/**
 * Comprehensive API Smoke Test — tests every endpoint for all 3 roles
 */
const http = require('http');

const BASE = 'http://localhost:5001';
let passed = 0,
  failed = 0;
const failures = [];

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        let j;
        try {
          j = JSON.parse(d);
        } catch {
          j = d;
        }
        resolve({ status: res.statusCode, body: j });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(name, res, expected) {
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (ok) {
    passed++;
    console.log(`  ✅ ${name} → ${res.status}`);
  } else {
    failed++;
    const m = typeof res.body === 'object' ? JSON.stringify(res.body).slice(0, 150) : res.body;
    failures.push(`${name}: expected ${expected}, got ${res.status} — ${m}`);
    console.log(`  ❌ ${name} → ${res.status} (expected ${expected}) ${m}`);
  }
  return res;
}

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  FitFlex Full API Smoke Test');
  console.log('══════════════════════════════════════════\n');

  // ── Health & Public ──
  console.log('── Health & Public ──');
  check('GET /api/health', await req('GET', '/api/health'), 200);
  check('GET /api/membership-plans', await req('GET', '/api/membership-plans'), 200);

  // ── Auth Login ──
  console.log('\n── Auth (Login) ──');
  const aL = check(
    'Login admin',
    await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' }),
    200,
  );
  const tL = check(
    'Login trainer',
    await req('POST', '/api/auth/login', { username: 'trainer', password: 'trainer123' }),
    200,
  );
  const mL = check(
    'Login member',
    await req('POST', '/api/auth/login', { username: 'member', password: 'member123' }),
    200,
  );
  check('Login bad input', await req('POST', '/api/auth/login', { password: '' }), 400);

  const AT = aL.body.token,
    TT = tL.body.token,
    MT = mL.body.token;

  // ── Auth Refresh ──
  console.log('\n── Auth (Refresh) ──');
  if (mL.body.refreshToken)
    check('Refresh token', await req('POST', '/api/auth/refresh', { refreshToken: mL.body.refreshToken }), 200);
  check('Refresh bad token', await req('POST', '/api/auth/refresh', { refreshToken: 'invalid' }), 401);

  // ── Core Authenticated ──
  console.log('\n── Core (Authenticated) ──');
  check('GET /api/me', await req('GET', '/api/me', null, AT), 200);
  check('GET /api/stats', await req('GET', '/api/stats', null, AT), 200);
  const usersRes = check('GET /api/users', await req('GET', '/api/users', null, AT), 200);
  check('GET /api/users/me', await req('GET', '/api/users/me', null, MT), 200);

  // Find a member user ID for later tests
  const usersArr = usersRes.body?.data || usersRes.body || [];
  const memberUserId =
    (Array.isArray(usersArr) ? usersArr : []).find((u) => u.role === 'member')?.id ||
    (Array.isArray(usersArr) ? usersArr : []).find((u) => u.role === 'member')?._id;

  // ── Member Routes ──
  console.log('\n── Member Routes ──');
  check('GET /me/attendance', await req('GET', '/api/me/attendance', null, MT), 200);
  check('POST /me/check-in', await req('POST', '/api/me/check-in', {}, MT), [201, 400]);
  check('POST /me/check-out', await req('POST', '/api/me/check-out', {}, MT), [200, 400]);
  check('GET /me/invoices', await req('GET', '/api/me/invoices', null, MT), 200);
  check('GET /me/progress', await req('GET', '/api/me/progress', null, MT), 200);
  check('POST /me/progress', await req('POST', '/api/me/progress', { weightKg: 70, notes: 'Smoke test' }, MT), 201);
  check('GET /me/classes', await req('GET', '/api/me/classes', null, MT), 200);
  check('GET /me/registrations', await req('GET', '/api/me/registrations', null, MT), 200);
  check('GET /me/workout-plans', await req('GET', '/api/me/workout-plans', null, MT), 200);
  check('GET /me/support-categories', await req('GET', '/api/me/support-categories', null, MT), 200);
  check('GET /me/tickets', await req('GET', '/api/me/tickets', null, MT), 200);
  const tkRes = check(
    'POST /me/tickets',
    await req('POST', '/api/me/tickets', { title: 'Test Ticket', message: 'Smoke test msg' }, MT),
    201,
  );
  const tkId = tkRes.body?._id;
  if (tkId) {
    check('GET /me/tickets/:id/replies', await req('GET', `/api/me/tickets/${tkId}/replies`, null, MT), 200);
    check(
      'POST /me/tickets/:id/replies',
      await req('POST', `/api/me/tickets/${tkId}/replies`, { message: 'Reply test' }, MT),
      201,
    );
  }
  check('GET /me/notifications', await req('GET', '/api/me/notifications', null, MT), 200);
  check('GET /me/notifications/unread-count', await req('GET', '/api/me/notifications/unread-count', null, MT), 200);
  check('PATCH /me/notifications/read-all', await req('PATCH', '/api/me/notifications/read-all', {}, MT), 200);
  check('PATCH /me/profile', await req('PATCH', '/api/me/profile', { phone: '555-9999' }, MT), 200);

  // ── Trainer Routes ──
  console.log('\n── Trainer Routes ──');
  check('GET /trainer/sessions', await req('GET', '/api/trainer/sessions', null, TT), 200);
  check('GET /trainer/classes', await req('GET', '/api/trainer/classes', null, TT), 200);
  check('GET /trainer/profile', await req('GET', '/api/trainer/profile', null, TT), 200);
  check('GET /trainer/members', await req('GET', '/api/trainer/members', null, TT), 200);

  if (memberUserId) {
    const sRes = check(
      'POST /trainer/sessions',
      await req(
        'POST',
        '/api/trainer/sessions',
        {
          userId: memberUserId,
          sessionDate: '2026-02-20',
          startTime: '10:00',
          endTime: '11:00',
          durationMinutes: 60,
          sessionType: 'personal',
        },
        TT,
      ),
      201,
    );
    if (sRes.body?._id) {
      check(
        'PATCH /trainer/sessions/:id',
        await req('PATCH', `/api/trainer/sessions/${sRes.body._id}`, { notes: 'Updated note' }, TT),
        200,
      );
      check(
        'DELETE /trainer/sessions/:id',
        await req('DELETE', `/api/trainer/sessions/${sRes.body._id}`, null, TT),
        200,
      );
    }
  }

  const cRes = check(
    'POST /trainer/classes',
    await req(
      'POST',
      '/api/trainer/classes',
      {
        name: 'Test HIIT',
        durationMinutes: 45,
        maxParticipants: 20,
        difficultyLevel: 'intermediate',
        category: 'cardio',
      },
      TT,
    ),
    201,
  );
  if (cRes.body?._id) {
    check(
      'PATCH /trainer/classes/:id',
      await req('PATCH', `/api/trainer/classes/${cRes.body._id}`, { description: 'Desc update' }, TT),
      200,
    );
    check(
      'GET /trainer/classes/:id/schedules',
      await req('GET', `/api/trainer/classes/${cRes.body._id}/schedules`, null, TT),
      200,
    );
    check(
      'POST /trainer/classes/:id/schedules',
      await req(
        'POST',
        `/api/trainer/classes/${cRes.body._id}/schedules`,
        {
          classDate: '2026-02-25',
          startTime: '09:00',
          endTime: '09:45',
          room: 'Studio A',
        },
        TT,
      ),
      201,
    );
    check('DELETE /trainer/classes/:id', await req('DELETE', `/api/trainer/classes/${cRes.body._id}`, null, TT), 200);
  }
  check('PATCH /trainer/profile', await req('PATCH', '/api/trainer/profile', { bio: 'Updated bio' }, TT), 200);

  // ── Admin Routes ──
  console.log('\n── Admin Routes ──');
  check('GET /admin/tables', await req('GET', '/api/admin/tables', null, AT), 200);
  check('GET /admin/table/users', await req('GET', '/api/admin/table/users', null, AT), 200);
  check('GET /admin/table/attendance', await req('GET', '/api/admin/table/attendance', null, AT), 200);
  check('GET /admin/training-sessions', await req('GET', '/api/admin/training-sessions', null, AT), 200);
  check('GET /admin/crud/users', await req('GET', '/api/admin/crud/users', null, AT), 200);
  check('GET /admin/crud/membership_plans', await req('GET', '/api/admin/crud/membership_plans', null, AT), 200);
  check('GET /admin/crud/trainers', await req('GET', '/api/admin/crud/trainers', null, AT), 200);
  check('GET /admin/crud/attendance', await req('GET', '/api/admin/crud/attendance', null, AT), 200);
  check('GET /admin/crud/invoices', await req('GET', '/api/admin/crud/invoices', null, AT), 200);
  check('GET /admin/crud/support_tickets', await req('GET', '/api/admin/crud/support_tickets', null, AT), 200);
  check('GET /admin/analytics/overview', await req('GET', '/api/admin/analytics/overview', null, AT), 200);
  check('GET /admin/analytics/details', await req('GET', '/api/admin/analytics/details', null, AT), 200);

  if (tkId) {
    check('GET /admin/tickets/:id/replies', await req('GET', `/api/admin/tickets/${tkId}/replies`, null, AT), 200);
    check(
      'POST /admin/tickets/:id/replies',
      await req('POST', `/api/admin/tickets/${tkId}/replies`, { message: 'Admin reply' }, AT),
      201,
    );
    check(
      'PATCH /admin/tickets/:id/assign',
      await req('PATCH', `/api/admin/tickets/${tkId}/assign`, { status: 'in_progress' }, AT),
      200,
    );
  }
  if (memberUserId) {
    check('GET /admin/members/:id/stats', await req('GET', `/api/admin/members/${memberUserId}/stats`, null, AT), 200);
    check(
      'POST /admin/notifications',
      await req(
        'POST',
        '/api/admin/notifications',
        { userId: memberUserId, title: 'Test', message: 'Hello', type: 'info' },
        AT,
      ),
      201,
    );
  }

  // ── Authorization ──
  console.log('\n── Authorization Checks ──');
  check('Member → admin = 403', await req('GET', '/api/admin/tables', null, MT), 403);
  check('Member → trainer = 403', await req('GET', '/api/trainer/sessions', null, MT), 403);
  check('No token = 401', await req('GET', '/api/me', null, null), 401);
  check('Bad token = 401', await req('GET', '/api/me', null, 'invalidtoken'), 401);
  check('404 route', await req('GET', '/api/nonexistent', null, AT), 404);

  // ── Registration ──
  console.log('\n── Registration ──');
  const uid = Date.now();
  check(
    'Register new user',
    await req('POST', '/api/auth/register', {
      name: 'Test User',
      username: `test${uid}`,
      email: `t${uid}@gym.local`,
      password: 'Test@1234',
    }),
    201,
  );
  check(
    'Register duplicate',
    await req('POST', '/api/auth/register', {
      name: 'Test User',
      username: `test${uid}`,
      email: `t${uid}@gym.local`,
      password: 'Test@1234',
    }),
    409,
  );
  check('Register bad input', await req('POST', '/api/auth/register', { name: 'X', password: 'weak' }), 400);

  // ── Summary ──
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('══════════════════════════════════════════');
  if (failures.length) {
    console.log('\n❌ Failures:');
    failures.forEach((f) => console.log(`   • ${f}`));
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Runner error:', e);
  process.exit(1);
});
