#!/usr/bin/env node
/**
 * Comprehensive API Smoke Test
 * Tests every endpoint across all 3 roles (admin, trainer, member)
 * Run: node src/scripts/smoke-test.js
 * Requires: server running on localhost:5001 with seeded data
 */
const http = require('http');

const BASE = 'http://localhost:5001';
const results = { pass: 0, fail: 0, errors: [] };

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;

    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(name, condition, detail) {
  if (condition) {
    results.pass++;
    console.log(`  ✅ ${name}`);
  } else {
    results.fail++;
    const msg = `${name} — ${detail || 'FAILED'}`;
    results.errors.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

async function run() {
  console.log('\n🏋️  FitFlex Comprehensive Smoke Test\n');

  // ═══════════════════════════════════════════════════════════
  // 1. HEALTH CHECK
  // ═══════════════════════════════════════════════════════════
  console.log('── Health ─────────────────────────────────');
  const health = await req('GET', '/api/health');
  assert('GET /api/health', health.status === 200 && health.body.ok === true, `status=${health.status}`);

  // ═══════════════════════════════════════════════════════════
  // 2. AUTH — LOGIN ALL ROLES
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Auth ───────────────────────────────────');

  const adminLogin = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  assert(
    'Admin login',
    adminLogin.status === 200 && adminLogin.body.token,
    `status=${adminLogin.status} body=${JSON.stringify(adminLogin.body).slice(0, 100)}`,
  );
  const adminToken = adminLogin.body.token;

  const trainerLogin = await req('POST', '/api/auth/login', { username: 'trainer', password: 'trainer123' });
  assert('Trainer login', trainerLogin.status === 200 && trainerLogin.body.token, `status=${trainerLogin.status}`);
  const trainerToken = trainerLogin.body.token;

  const memberLogin = await req('POST', '/api/auth/login', { username: 'member', password: 'member123' });
  assert('Member login', memberLogin.status === 200 && memberLogin.body.token, `status=${memberLogin.status}`);
  const memberToken = memberLogin.body.token;

  // Login validation
  const badLogin = await req('POST', '/api/auth/login', { password: '' });
  assert('Login validation rejects empty', badLogin.status === 400, `status=${badLogin.status}`);

  // Refresh token
  if (memberLogin.body.refreshToken) {
    const refresh = await req('POST', '/api/auth/refresh', { refreshToken: memberLogin.body.refreshToken });
    assert('Token refresh', refresh.status === 200 && refresh.body.token, `status=${refresh.status}`);
  }

  if (!adminToken || !trainerToken || !memberToken) {
    console.log('\n🛑  Cannot proceed without valid tokens. Aborting.');
    printSummary();
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 3. CORE ROUTES (any authenticated user)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Core Routes ────────────────────────────');

  const me = await req('GET', '/api/me', null, memberToken);
  assert('GET /api/me', me.status === 200 && me.body.user, `status=${me.status}`);

  const stats = await req('GET', '/api/stats', null, adminToken);
  assert('GET /api/stats', stats.status === 200, `status=${stats.status}`);

  const users = await req('GET', '/api/users', null, adminToken);
  assert('GET /api/users (admin)', users.status === 200 && Array.isArray(users.body.data), `status=${users.status}`);

  const profile = await req('GET', '/api/users/me', null, memberToken);
  assert('GET /api/users/me', profile.status === 200, `status=${profile.status}`);

  const plans = await req('GET', '/api/membership-plans');
  assert(
    'GET /api/membership-plans (public)',
    plans.status === 200 && Array.isArray(plans.body),
    `status=${plans.status}`,
  );

  // Unauthorized access
  const noAuth = await req('GET', '/api/me');
  assert('Unauthorized rejected', noAuth.status === 401, `status=${noAuth.status}`);

  // ═══════════════════════════════════════════════════════════
  // 4. MEMBER ROUTES (/api/me/...)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Member Routes ──────────────────────────');

  const attendance = await req('GET', '/api/me/attendance', null, memberToken);
  assert(
    'GET /me/attendance',
    attendance.status === 200 && Array.isArray(attendance.body.data),
    `status=${attendance.status}`,
  );

  const checkIn = await req('POST', '/api/me/check-in', {}, memberToken);
  assert('POST /me/check-in', checkIn.status === 201 || checkIn.status === 400, `status=${checkIn.status}`);

  if (checkIn.status === 201) {
    const checkOut = await req('POST', '/api/me/check-out', {}, memberToken);
    assert(
      'POST /me/check-out',
      checkOut.status === 200,
      `status=${checkOut.status} body=${JSON.stringify(checkOut.body).slice(0, 100)}`,
    );
  }

  const invoices = await req('GET', '/api/me/invoices', null, memberToken);
  assert('GET /me/invoices', invoices.status === 200 && Array.isArray(invoices.body.data), `status=${invoices.status}`);

  const progressList = await req('GET', '/api/me/progress', null, memberToken);
  assert(
    'GET /me/progress',
    progressList.status === 200 && Array.isArray(progressList.body.data),
    `status=${progressList.status}`,
  );

  const addProgress = await req('POST', '/api/me/progress', { weightKg: 70, notes: 'Smoke test' }, memberToken);
  assert(
    'POST /me/progress',
    addProgress.status === 201 && addProgress.body._id,
    `status=${addProgress.status} body=${JSON.stringify(addProgress.body).slice(0, 150)}`,
  );

  const classes = await req('GET', '/api/me/classes', null, memberToken);
  assert('GET /me/classes', classes.status === 200 && Array.isArray(classes.body.data), `status=${classes.status}`);

  const registrations = await req('GET', '/api/me/registrations', null, memberToken);
  assert(
    'GET /me/registrations',
    registrations.status === 200 && Array.isArray(registrations.body.data),
    `status=${registrations.status}`,
  );

  const workoutPlans = await req('GET', '/api/me/workout-plans', null, memberToken);
  assert(
    'GET /me/workout-plans',
    workoutPlans.status === 200 && Array.isArray(workoutPlans.body),
    `status=${workoutPlans.status}`,
  );

  const supportCats = await req('GET', '/api/me/support-categories', null, memberToken);
  assert(
    'GET /me/support-categories',
    supportCats.status === 200 && Array.isArray(supportCats.body),
    `status=${supportCats.status}`,
  );

  const tickets = await req('GET', '/api/me/tickets', null, memberToken);
  assert('GET /me/tickets', tickets.status === 200 && Array.isArray(tickets.body.data), `status=${tickets.status}`);

  const newTicket = await req(
    'POST',
    '/api/me/tickets',
    { title: 'Smoke Test Ticket', message: 'Testing support' },
    memberToken,
  );
  assert(
    'POST /me/tickets',
    newTicket.status === 201 && newTicket.body._id,
    `status=${newTicket.status} body=${JSON.stringify(newTicket.body).slice(0, 150)}`,
  );

  if (newTicket.body._id) {
    const replies = await req('GET', `/api/me/tickets/${newTicket.body._id}/replies`, null, memberToken);
    assert(
      'GET /me/tickets/:id/replies',
      replies.status === 200 && Array.isArray(replies.body),
      `status=${replies.status}`,
    );

    const addReply = await req(
      'POST',
      `/api/me/tickets/${newTicket.body._id}/replies`,
      { message: 'Reply test' },
      memberToken,
    );
    assert('POST /me/tickets/:id/replies', addReply.status === 201 && addReply.body._id, `status=${addReply.status}`);
  }

  const notifications = await req('GET', '/api/me/notifications', null, memberToken);
  assert(
    'GET /me/notifications',
    notifications.status === 200 && Array.isArray(notifications.body.data),
    `status=${notifications.status}`,
  );

  const unread = await req('GET', '/api/me/notifications/unread-count', null, memberToken);
  assert(
    'GET /me/notifications/unread-count',
    unread.status === 200 && typeof unread.body.count === 'number',
    `status=${unread.status}`,
  );

  const markAll = await req('PATCH', '/api/me/notifications/read-all', {}, memberToken);
  assert('PATCH /me/notifications/read-all', markAll.status === 200, `status=${markAll.status}`);

  const profileUpdate = await req('PATCH', '/api/me/profile', { phone: '555-9999' }, memberToken);
  assert('PATCH /me/profile', profileUpdate.status === 200, `status=${profileUpdate.status}`);

  // ═══════════════════════════════════════════════════════════
  // 5. TRAINER ROUTES (/api/trainer/...)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Trainer Routes ─────────────────────────');

  const tSessions = await req('GET', '/api/trainer/sessions', null, trainerToken);
  assert(
    'GET /trainer/sessions',
    tSessions.status === 200 && Array.isArray(tSessions.body.data),
    `status=${tSessions.status}`,
  );

  // Need a member user ID for creating a session
  const memberId = memberLogin.body.user?.id;
  if (memberId) {
    const newSession = await req(
      'POST',
      '/api/trainer/sessions',
      {
        userId: memberId,
        sessionDate: '2026-02-15',
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        sessionType: 'personal',
      },
      trainerToken,
    );
    assert(
      'POST /trainer/sessions',
      newSession.status === 201 && newSession.body._id,
      `status=${newSession.status} body=${JSON.stringify(newSession.body).slice(0, 150)}`,
    );

    if (newSession.body._id) {
      const updateSession = await req(
        'PATCH',
        `/api/trainer/sessions/${newSession.body._id}`,
        { notes: 'Updated' },
        trainerToken,
      );
      assert('PATCH /trainer/sessions/:id', updateSession.status === 200, `status=${updateSession.status}`);

      const deleteSession = await req('DELETE', `/api/trainer/sessions/${newSession.body._id}`, null, trainerToken);
      assert(
        'DELETE /trainer/sessions/:id',
        deleteSession.status === 200 && deleteSession.body.ok,
        `status=${deleteSession.status}`,
      );
    }
  }

  const tClasses = await req('GET', '/api/trainer/classes', null, trainerToken);
  assert(
    'GET /trainer/classes',
    tClasses.status === 200 && Array.isArray(tClasses.body.data),
    `status=${tClasses.status}`,
  );

  const newClass = await req(
    'POST',
    '/api/trainer/classes',
    {
      name: 'Smoke Test Class',
      durationMinutes: 45,
      difficultyLevel: 'beginner',
      category: 'cardio',
    },
    trainerToken,
  );
  assert(
    'POST /trainer/classes',
    newClass.status === 201 && newClass.body._id,
    `status=${newClass.status} body=${JSON.stringify(newClass.body).slice(0, 150)}`,
  );

  if (newClass.body._id) {
    const updateClass = await req(
      'PATCH',
      `/api/trainer/classes/${newClass.body._id}`,
      { description: 'Updated desc' },
      trainerToken,
    );
    assert('PATCH /trainer/classes/:id', updateClass.status === 200, `status=${updateClass.status}`);

    // Schedule
    const addSchedule = await req(
      'POST',
      `/api/trainer/classes/${newClass.body._id}/schedules`,
      {
        classDate: '2026-02-20',
        startTime: '09:00',
        endTime: '09:45',
        room: 'A1',
      },
      trainerToken,
    );
    assert(
      'POST /trainer/classes/:id/schedules',
      addSchedule.status === 201 && addSchedule.body._id,
      `status=${addSchedule.status}`,
    );

    const listSchedules = await req('GET', `/api/trainer/classes/${newClass.body._id}/schedules`, null, trainerToken);
    assert(
      'GET /trainer/classes/:id/schedules',
      listSchedules.status === 200 && Array.isArray(listSchedules.body),
      `status=${listSchedules.status}`,
    );

    const deleteClass = await req('DELETE', `/api/trainer/classes/${newClass.body._id}`, null, trainerToken);
    assert(
      'DELETE /trainer/classes/:id',
      deleteClass.status === 200 && deleteClass.body.ok,
      `status=${deleteClass.status}`,
    );
  }

  const tProfile = await req('GET', '/api/trainer/profile', null, trainerToken);
  assert('GET /trainer/profile', tProfile.status === 200, `status=${tProfile.status}`);

  const tProfileUpdate = await req('PATCH', '/api/trainer/profile', { bio: 'Updated bio' }, trainerToken);
  assert('PATCH /trainer/profile', tProfileUpdate.status === 200, `status=${tProfileUpdate.status}`);

  const tMembers = await req('GET', '/api/trainer/members', null, trainerToken);
  assert('GET /trainer/members', tMembers.status === 200 && Array.isArray(tMembers.body), `status=${tMembers.status}`);

  // Role check — member should not access trainer routes
  const forbid = await req('GET', '/api/trainer/sessions', null, memberToken);
  assert('Member cannot access trainer routes', forbid.status === 403, `status=${forbid.status}`);

  // ═══════════════════════════════════════════════════════════
  // 6. ADMIN ROUTES (/api/admin/...)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Admin Routes ───────────────────────────');

  const tables = await req('GET', '/api/admin/tables', null, adminToken);
  assert('GET /admin/tables', tables.status === 200 && Array.isArray(tables.body), `status=${tables.status}`);

  const tableData = await req('GET', '/api/admin/table/users', null, adminToken);
  assert(
    'GET /admin/table/users',
    tableData.status === 200 && Array.isArray(tableData.body.data),
    `status=${tableData.status}`,
  );

  const trainingSessions = await req('GET', '/api/admin/training-sessions', null, adminToken);
  assert(
    'GET /admin/training-sessions',
    trainingSessions.status === 200 && Array.isArray(trainingSessions.body.data),
    `status=${trainingSessions.status}`,
  );

  // CRUD — use snake_case model names
  const crudList = await req('GET', '/api/admin/crud/users', null, adminToken);
  assert(
    'GET /admin/crud/users',
    crudList.status === 200 && Array.isArray(crudList.body.data),
    `status=${crudList.status}`,
  );

  const crudPlansList = await req('GET', '/api/admin/crud/membership_plans', null, adminToken);
  assert(
    'GET /admin/crud/membership_plans',
    crudPlansList.status === 200 && Array.isArray(crudPlansList.body.data),
    `status=${crudPlansList.status}`,
  );

  // Analytics
  const analyticsOverview = await req('GET', '/api/admin/analytics/overview', null, adminToken);
  assert(
    'GET /admin/analytics/overview',
    analyticsOverview.status === 200 && typeof analyticsOverview.body.totalUsers === 'number',
    `status=${analyticsOverview.status}`,
  );

  const analyticsDetails = await req('GET', '/api/admin/analytics/details', null, adminToken);
  assert(
    'GET /admin/analytics/details',
    analyticsDetails.status === 200 && Array.isArray(analyticsDetails.body.usersByRole),
    `status=${analyticsDetails.status}`,
  );

  // Admin member stats
  if (memberId) {
    const memberStats = await req('GET', `/api/admin/members/${memberId}/stats`, null, adminToken);
    assert('GET /admin/members/:id/stats', memberStats.status === 200, `status=${memberStats.status}`);
  }

  // Role check — member should not access admin routes
  const adminForbid = await req('GET', '/api/admin/tables', null, memberToken);
  assert('Member cannot access admin routes', adminForbid.status === 403, `status=${adminForbid.status}`);

  // ═══════════════════════════════════════════════════════════
  // 7. REGISTRATION (last, so rate limiter doesn't block above)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Registration ───────────────────────────');

  const register = await req('POST', '/api/auth/register', {
    name: 'Smoke Tester',
    username: 'smoketest_' + Date.now(),
    email: `smoke_${Date.now()}@test.local`,
    password: 'Test1234',
  });
  assert(
    'POST /api/auth/register',
    register.status === 201 && register.body.token,
    `status=${register.status} body=${JSON.stringify(register.body).slice(0, 150)}`,
  );

  // ═══════════════════════════════════════════════════════════
  // 8. ERROR HANDLING
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Error Handling ─────────────────────────');

  const notFound = await req('GET', '/api/nonexistent', null, adminToken);
  assert('404 on unknown route', notFound.status === 404, `status=${notFound.status}`);

  const badId = await req('GET', '/api/admin/crud/users/invalidid', null, adminToken);
  assert('400 on bad ObjectId', badId.status === 400, `status=${badId.status}`);

  printSummary();
}

function printSummary() {
  console.log('\n═══════════════════════════════════════════');
  console.log(`  TOTAL: ${results.pass + results.fail}  |  ✅ PASS: ${results.pass}  |  ❌ FAIL: ${results.fail}`);
  if (results.errors.length) {
    console.log('\n  Failed tests:');
    results.errors.forEach((e) => console.log(`    • ${e}`));
  }
  console.log('═══════════════════════════════════════════\n');
  process.exit(results.fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
