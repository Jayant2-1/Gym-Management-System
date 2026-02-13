/*
const bcrypt = require('bcryptjs');

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isoDate(d) {
  return new Date(d).toISOString().split('T')[0];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function seedIfEmpty(db, cb) {
  // Seed only if we have no users.
  db.get('SELECT COUNT(*) as c FROM users', (err, row) => {
    if (err) return cb(err);
    if (row?.c > 0) return cb(null, { skipped: true });

    const now = new Date();

    // 1) membership plans
    const plans = [
      {
        name: 'Basic',
        monthly_fee: 29.99,
        duration_days: 30,
        max_visits_per_week: 7,
        includes_trainer: 0,
        const bcrypt = require('bcryptjs');

        async function seedIfEmpty(models) {
          const { MembershipPlan, User, Trainer, FitnessClass, ClassSchedule, Exercise, WorkoutPlan, WorkoutExercise, SupportCategory } = models;

          const existing = await User.countDocuments();
          if (existing > 0) {
            console.log('Seed skipped (users already exist).');
            return { skipped: true };
          }

          const plans = await MembershipPlan.insertMany([
            {
              name: 'Basic',
              description: 'Basic membership plan',
              monthlyFee: 29.99,
              durationDays: 30,
              maxVisitsPerWeek: 7,
              includesTrainer: false,
              includesClasses: false,
            },
            {
              name: 'Standard',
              description: 'Standard membership plan',
              monthlyFee: 49.99,
              durationDays: 30,
              maxVisitsPerWeek: 14,
              includesTrainer: false,
              includesClasses: true,
            },
            {
              name: 'Premium',
              description: 'Premium membership plan',
              monthlyFee: 79.99,
              durationDays: 30,
              includesTrainer: true,
              includesClasses: true,
            },
          ]);

          const [basicPlan] = plans;

          const adminUser = await User.create({
            username: 'admin',
            email: 'admin@gym.local',
            password: bcrypt.hashSync('admin123', 10),
            role: 'admin',
            name: 'Admin User',
            membershipPlan: basicPlan._id,
          });

          const trainerUser = await User.create({
            username: 'trainer',
            email: 'trainer@gym.local',
            password: bcrypt.hashSync('trainer123', 10),
            role: 'trainer',
            name: 'Trainer User',
            membershipPlan: basicPlan._id,
          });

          const memberUser = await User.create({
            username: 'member',
            email: 'member@gym.local',
            password: bcrypt.hashSync('member123', 10),
            role: 'member',
            name: 'Member User',
            membershipPlan: basicPlan._id,
          });

          const trainer = await Trainer.create({
            user: trainerUser._id,
            specialization: 'Strength & Conditioning',
            certification: 'CPT',
            hourlyRate: 40,
            experienceYears: 5,
            bio: 'Focused on sustainable strength and mobility.',
          });

          const yogaClass = await FitnessClass.create({
            name: 'Morning Yoga',
            description: 'Mobility and recovery class',
            trainer: trainer._id,
            durationMinutes: 60,
            difficultyLevel: 'Beginner',
            category: 'yoga',
          });

          await ClassSchedule.create({
            fitnessClass: yogaClass._id,
            classDate: new Date(),
            startTime: '09:00',
            endTime: '10:00',
            room: 'Studio A',
          });

          const squat = await Exercise.create({
            name: 'Back Squat',
            description: 'Barbell back squat',
            muscleGroup: 'legs',
            equipmentNeeded: 'barbell',
            difficultyLevel: 'intermediate',
          });

          const plan = await WorkoutPlan.create({
            user: memberUser._id,
            trainer: trainer._id,
            name: 'Beginner Strength',
            description: '3-day strength program',
            goal: 'general_fitness',
            difficultyLevel: 'beginner',
          });

          await WorkoutExercise.create({
            workoutPlan: plan._id,
            exercise: squat._id,
            dayOfWeek: 1,
            sets: 3,
            reps: 8,
            weightKg: 40,
            restSeconds: 120,
          });

          await SupportCategory.insertMany([
            { name: 'Billing', description: 'Invoices and payments' },
            { name: 'Technical', description: 'App access and issues' },
            { name: 'Membership', description: 'Plan changes and renewals' },
          ]);

          console.log('Seed complete.');
          return { ok: true, adminUserId: adminUser.id };
        }

        module.exports = { seedIfEmpty };
              );
              const exerciseIds = [];
              exerciseList.forEach((ex) => {
                exStmt.run(
                  [
                    ex.name,
                    `${ex.name} description`,
                    ex.muscle_group,
                    ex.equipment_needed,
                    ex.difficulty_level,
                    null,
                    'active',
                  ],
                  function (err3) {
                    if (!err3) exerciseIds.push(this.lastID);
                  }
                );
              });
              exStmt.finalize(() => {
                // 5) workout plans + exercises mapping for a handful of members
                const planStmt2 = db.prepare(
                  `INSERT INTO workout_plans (user_id, trainer_id, name, description, goal, difficulty_level, start_date, end_date, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                const wxStmt = db.prepare(
                  `INSERT INTO workout_exercises (workout_plan_id, exercise_id, day_of_week, sets, reps, weight_kg, duration_minutes, rest_seconds, notes, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                const sampleMembers = memberIds.slice(0, 12);
                const createdWorkoutPlanIds = [];

                sampleMembers.forEach((uid, i) => {
                  const goal = rand(['weight_loss', 'muscle_gain', 'endurance', 'general_fitness']);
                  const diff = rand(['beginner', 'intermediate', 'advanced']);
                  planStmt2.run(
                    [
                      uid,
                      trainerId,
                      `Plan ${i + 1}`,
                      'A progressive plan tailored to the member.',
                      goal,
                      diff,
                      isoDate(addDays(now, -14)),
                      isoDate(addDays(now, 42)),
                      'active',
                    ],
                    function (err4) {
                      if (!err4)
                        createdWorkoutPlanIds.push({ workout_plan_id: this.lastID, user_id: uid });
                    }
                  );
                });

                planStmt2.finalize(() => {
                  createdWorkoutPlanIds.forEach((p, idx) => {
                    // 3 days/week
                    [1, 3, 5].forEach((day, dayIdx) => {
                      const exId = exerciseIds[(idx + dayIdx) % exerciseIds.length];
                      wxStmt.run([
                        p.workout_plan_id,
                        exId,
                        day,
                        3,
                        10,
                        40,
                        null,
                        90,
                        'Keep form strict.',
                        dayIdx,
                      ]);
                    });
                  });

                  wxStmt.finalize(() => {
                    // 6) training sessions (trainer <-> members)
                    const sessStmt = db.prepare(
                      `INSERT INTO training_sessions (trainer_id, user_id, session_date, start_time, end_time, duration_minutes, session_type, status, notes, cost)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                    );

                    const sessionMembers = memberIds.slice(0, 20);
                    sessionMembers.forEach((uid, i) => {
                      const dayOffset = i % 10;
                      const date = isoDate(addDays(now, -dayOffset));
                      const startH = 9 + (i % 6);
                      sessStmt.run([
                        trainerId,
                        uid,
                        date,
                        `${String(startH).padStart(2, '0')}:00`,
                        `${String(startH).padStart(2, '0')}:45`,
                        45,
                        rand(['personal', 'assessment', 'group']),
                        rand(['scheduled', 'completed']),
                        'Focus: technique + consistency.',
                        30,
                      ]);
                    });

                    sessStmt.finalize(() => {
                      // 7) attendance + access logs
                      const attStmt = db.prepare(
                        `INSERT INTO attendance (user_id, check_in, check_out, date, duration_minutes, notes)
                         VALUES (?, ?, ?, ?, ?, ?)`
                      );
                      const accessStmt = db.prepare(
                        `INSERT INTO access_logs (user_id, access_time, access_type, reason)
                         VALUES (?, ?, ?, ?)`
                      );

                      memberIds.slice(0, 60).forEach((uid, i) => {
                        const d = isoDate(addDays(now, -(i % 14)));
                        const checkIn = `${d}T${String(7 + (i % 8)).padStart(2, '0')}:00:00.000Z`;
                        const checkOut = `${d}T${String(8 + (i % 8)).padStart(2, '0')}:10:00.000Z`;
                        attStmt.run([uid, checkIn, checkOut, d, 70, null]);
                        accessStmt.run([uid, checkIn, 'check_in', null]);
                        accessStmt.run([uid, checkOut, 'check_out', null]);
                      });

                      attStmt.finalize(() => {
                        accessStmt.finalize(() => {
                          // 8) classes + schedule + registrations
                          db.run(
                            `INSERT INTO fitness_classes (name, description, trainer_id, max_participants, duration_minutes, difficulty_level, category, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                              'HIIT Blast',
                              'High intensity interval training.',
                              trainerId,
                              20,
                              45,
                              'intermediate',
                              'cardio',
                              'active',
                            ],
                            function (err5) {
                              if (err5) return cb(err5);
                              const classId = this.lastID;

                              const schedStmt = db.prepare(
                                `INSERT INTO class_schedule (fitness_class_id, class_date, start_time, end_time, room, status)
                                 VALUES (?, ?, ?, ?, ?, ?)`
                              );
                              const scheduleIds = [];
                              for (let i = 0; i < 6; i++) {
                                const d = isoDate(addDays(now, i - 3));
                                schedStmt.run(
                                  [classId, d, '18:00', '18:45', 'Studio A', 'scheduled'],
                                  function (err6) {
                                    if (!err6) scheduleIds.push(this.lastID);
                                  }
                                );
                              }
                              schedStmt.finalize(() => {
                                const regStmt = db.prepare(
                                  `INSERT OR IGNORE INTO class_registrations (class_schedule_id, user_id, status, notes)
                                   VALUES (?, ?, ?, ?)`
                                );
                                scheduleIds.forEach((sid, idx) => {
                                  memberIds.slice(idx * 5, idx * 5 + 10).forEach((uid) => {
                                    regStmt.run([
                                      sid,
                                      uid,
                                      rand(['registered', 'attended', 'cancelled']),
                                      null,
                                    ]);
                                  });
                                });
                                regStmt.finalize(() => {
                                  // 9) equipment + maintenance
                                  db.run(
                                    `INSERT INTO equipment (name, category, brand, model, serial_number, purchase_date, purchase_price, status, last_maintenance_date, next_maintenance_date, location, notes)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                      'Treadmill X',
                                      'Cardio',
                                      'ProRun',
                                      'XR-200',
                                      'SN-TR-0001',
                                      isoDate(addDays(now, -400)),
                                      2500,
                                      'active',
                                      isoDate(addDays(now, -30)),
                                      isoDate(addDays(now, 60)),
                                      'Cardio Zone',
                                      null,
                                    ],
                                    function (err7) {
                                      if (err7) return cb(err7);
                                      const equipmentId = this.lastID;
                                      db.run(
                                        `INSERT INTO equipment_maintenance (equipment_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date, status)
                                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [
                                          equipmentId,
                                          isoDate(addDays(now, -30)),
                                          'routine',
                                          'Belt inspection and lubrication',
                                          120,
                                          'Technician A',
                                          isoDate(addDays(now, 60)),
                                          'completed',
                                        ],
                                        (err8) => {
                                          if (err8) return cb(err8);

                                          // 10) support categories + tickets + replies
                                          const catStmt = db.prepare(
                                            `INSERT INTO support_categories (name, description) VALUES (?, ?)`
                                          );
                                          const cats = [
                                            ['Billing', 'Invoices, payments, refunds'],
                                            ['Training', 'Sessions, plans'],
                                            ['Membership', 'Plans, renewals'],
                                          ];
                                          const catIds = [];
                                          cats.forEach((c) => {
                                            catStmt.run(c, function (err9) {
                                              if (!err9) catIds.push(this.lastID);
                                            });
                                          });
                                          catStmt.finalize(() => {
                                            const ticketStmt = db.prepare(
                                              `INSERT INTO support_tickets (user_id, category_id, title, message, priority, status, assigned_to, resolution_notes)
                                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                                            );
                                            const ticketIds = [];
                                            memberIds.slice(0, 8).forEach((uid, i) => {
                                              ticketStmt.run(
                                                [
                                                  uid,
                                                  catIds[i % catIds.length],
                                                  `Help request #${i + 1}`,
                                                  'I need help with my account.',
                                                  rand(['low', 'medium', 'high']),
                                                  rand(['open', 'in_progress', 'resolved']),
                                                  trainerUserId,
                                                  null,
                                                ],
                                                function (err10) {
                                                  if (!err10)
                                                    ticketIds.push({
                                                      id: this.lastID,
                                                      user_id: uid,
                                                    });
                                                }
                                              );
                                            });
                                            ticketStmt.finalize(() => {
                                              const replyStmt = db.prepare(
                                                `INSERT INTO ticket_replies (ticket_id, user_id, message, is_internal)
                                                 VALUES (?, ?, ?, ?)`
                                              );
                                              ticketIds.forEach((t) => {
                                                replyStmt.run([
                                                  t.id,
                                                  trainerUserId,
                                                  'We are looking into this.',
                                                  1,
                                                ]);
                                                replyStmt.run([t.id, t.user_id, 'Thanks!', 0]);
                                              });
                                              replyStmt.finalize(() => {
                                                // 11) member progress
                                                const progStmt = db.prepare(
                                                  `INSERT OR IGNORE INTO member_progress (user_id, record_date, weight_kg, body_fat_percentage, muscle_mass_kg, chest_cm, waist_cm, hips_cm, bmi, notes)
                                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                                );
                                                memberIds.slice(0, 20).forEach((uid, i) => {
                                                  const d = isoDate(addDays(now, -(i % 6) * 7));
                                                  const w = 60 + Math.random() * 25;
                                                  const h = 1.7;
                                                  const bmi = w / (h * h);
                                                  progStmt.run([
                                                    uid,
                                                    d,
                                                    w.toFixed(2),
                                                    (15 + Math.random() * 10).toFixed(2),
                                                    (25 + Math.random() * 8).toFixed(2),
                                                    (85 + Math.random() * 10).toFixed(2),
                                                    (70 + Math.random() * 10).toFixed(2),
                                                    (90 + Math.random() * 10).toFixed(2),
                                                    bmi.toFixed(2),
                                                    null,
                                                  ]);
                                                });
                                                progStmt.finalize(() => {
                                                  // 12) gym usage stats
                                                  const usageStmt = db.prepare(
                                                    `INSERT OR IGNORE INTO gym_usage_stats (stat_date, total_members, active_members, daily_visits, peak_hour_visits, new_registrations, membership_renewals, total_revenue)
                                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                                                  );
                                                  for (let i = 0; i < 14; i++) {
                                                    const d = isoDate(addDays(now, -i));
                                                    usageStmt.run([
                                                      d,
                                                      103,
                                                      90,
                                                      30 + Math.floor(Math.random() * 40),
                                                      10 + Math.floor(Math.random() * 20),
                                                      Math.floor(Math.random() * 6),
                                                      Math.floor(Math.random() * 4),
                                                      (500 + Math.random() * 1200).toFixed(2),
                                                    ]);
                                                  }
                                                  usageStmt.finalize(() => {
                                                    // 13) invoices + payments
                                                    const invStmt = db.prepare(
                                                      `INSERT INTO invoices (user_id, membership_plan_id, invoice_number, amount, issue_date, due_date, status, tax_amount, discount_amount, total_amount, notes)
                                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                                                    );
                                                    const payStmt = db.prepare(
                                                      `INSERT INTO payments (invoice_id, user_id, amount, payment_method, transaction_id, status, notes)
                                                       VALUES (?, ?, ?, ?, ?, ?, ?)`
                                                    );

                                                    const invoiceUsers = memberIds.slice(0, 25);
                                                    invoiceUsers.forEach((uid, i) => {
                                                      const issue = isoDate(
                                                        addDays(now, -(i % 6) * 10)
                                                      );
                                                      const due = isoDate(
                                                        addDays(now, -(i % 6) * 10 + 7)
                                                      );
                                                      const amount = Number(
                                                        [19.99, 29.99, 49.99, 79.99][i % 4]
                                                      );
                                                      const tax = Number(
                                                        (amount * 0.08).toFixed(2)
                                                      );
                                                      const total = Number(
                                                        (amount + tax).toFixed(2)
                                                      );

                                                      // Ensure we always create some paid invoices so payments exist.
                                                      const status =
                                                        i < 12
                                                          ? 'paid'
                                                          : rand(['pending', 'overdue']);

                                                      const invoiceNumber = `INV-${issue.replaceAll('-', '')}-${String(i + 1).padStart(4, '0')}`;

                                                      invStmt.run(
                                                        [
                                                          uid,
                                                          (i % 5) + 1,
                                                          invoiceNumber,
                                                          amount,
                                                          issue,
                                                          due,
                                                          status,
                                                          tax,
                                                          0,
                                                          total,
                                                          null,
                                                        ],
                                                        function (err11) {
                                                          if (err11) return;
                                                          const invoiceId = this.lastID;
                                                          if (status === 'paid') {
                                                            payStmt.run([
                                                              invoiceId,
                                                              uid,
                                                              total,
                                                              rand(['cash', 'card', 'online']),
                                                              `TX-${invoiceId}-${Date.now()}-${i}`,
                                                              'completed',
                                                              null,
                                                            ]);
                                                          }
                                                        }
                                                      );
                                                    });

                                                    invStmt.finalize(() => {
                                                      payStmt.finalize(() => {
                                                        cb(null, { skipped: false });
                                                      });
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                        }
                                      );
                                    }
                                  );
                                });
                              });
                            }
                          );
                        });
                      });
                    });
                  });
                });
              });
            }
          );
        });
      });
    });
  });
}

*/
const { seedIfEmpty } = require('./seed.mongo');

module.exports = { seedIfEmpty };
