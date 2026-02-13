-- Membership Plans table
CREATE TABLE IF NOT EXISTS membership_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    monthly_fee DECIMAL(10,2) NOT NULL,
    signup_fee DECIMAL(10,2) DEFAULT 0,
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    duration_days INTEGER NOT NULL,
    max_visits_per_week INTEGER,
    includes_trainer BOOLEAN DEFAULT 0,
    includes_classes BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
);

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    membership_plan_id INTEGER,
    status TEXT DEFAULT 'active',
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    fitness_goals TEXT,
    medical_conditions TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    is_email_verified BOOLEAN DEFAULT 0,
    last_login_at TIMESTAMP,
    permissions TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
);

-- ==================== ATTENDANCE & ACCESS CONTROL ====================

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out TIMESTAMP NULL,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_type TEXT DEFAULT 'check_in', -- check_in, check_out, denied
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== FINANCIAL MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    membership_plan_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT DEFAULT 'cash', -- cash, card, transfer, online
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== FITNESS & TRAINING ====================

CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    specialization TEXT,
    certification TEXT,
    hourly_rate DECIMAL(8,2),
    experience_years INTEGER,
    bio TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    session_type TEXT, -- personal, group, assessment
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    notes TEXT,
    cost DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    trainer_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT, -- weight_loss, muscle_gain, endurance, general_fitness
    difficulty_level TEXT, -- beginner, intermediate, advanced
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT,
    equipment_needed TEXT,
    difficulty_level TEXT,
    video_url TEXT,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_plan_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    day_of_week INTEGER, -- 1-7 for Monday-Sunday
    sets INTEGER,
    reps INTEGER,
    weight_kg DECIMAL(6,2),
    duration_minutes INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ==================== EQUIPMENT MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    status TEXT DEFAULT 'active', -- active, maintenance, retired
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    location TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type TEXT, -- routine, repair, replacement
    description TEXT,
    cost DECIMAL(8,2),
    technician TEXT,
    next_maintenance_date DATE,
    status TEXT DEFAULT 'completed',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- ==================== CLASSES & SCHEDULING ====================

CREATE TABLE IF NOT EXISTS fitness_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    trainer_id INTEGER,
    max_participants INTEGER,
    duration_minutes INTEGER NOT NULL,
    difficulty_level TEXT,
    category TEXT, -- yoga, cardio, strength, dance
    status TEXT DEFAULT 'active',
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS class_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fitness_class_id INTEGER NOT NULL,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    status TEXT DEFAULT 'scheduled',
    FOREIGN KEY (fitness_class_id) REFERENCES fitness_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_schedule_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'registered', -- registered, attended, cancelled, no_show
    notes TEXT,
    FOREIGN KEY (class_schedule_id) REFERENCES class_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(class_schedule_id, user_id)
);

-- ==================== SUPPORT & COMMUNICATION ====================

CREATE TABLE IF NOT EXISTS support_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to INTEGER, -- admin/trainer user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES support_categories(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT 0, -- internal notes vs customer-facing replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== ANALYTICS & REPORTING ====================

CREATE TABLE IF NOT EXISTS member_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    bmi DECIMAL(4,2),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, record_date)
);

CREATE TABLE IF NOT EXISTS gym_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL UNIQUE,
    total_members INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    daily_visits INTEGER DEFAULT 0,
    peak_hour_visits INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    membership_renewals INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== AUDIT LOGGING ====================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    target_model TEXT,
    target_id TEXT,
    metadata TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- ==================== INDEXES FOR PERFORMANCE ====================

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_date ON training_sessions(trainer_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON training_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_registrations_user ON class_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_plan_id, status);

-- ==================== TRIGGERS FOR DATA INTEGRITY ====================

-- Auto-update updated_at timestamp for support tickets
CREATE TRIGGER IF NOT EXISTS update_ticket_timestamp 
AFTER UPDATE ON support_tickets
FOR EACH ROW
BEGIN
    UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Calculate attendance duration automatically
CREATE TRIGGER IF NOT EXISTS calculate_attendance_duration 
AFTER UPDATE OF check_out ON attendance
FOR EACH ROW
WHEN NEW.check_out IS NOT NULL
BEGIN
    UPDATE attendance 
    SET duration_minutes = ROUND((JULIANDAY(NEW.check_out) - JULIANDAY(NEW.check_in)) * 24 * 60)
    WHERE id = NEW.id;
END;

-- Auto-generate invoice numbers
DROP TRIGGER IF EXISTS generate_invoice_number;
CREATE TRIGGER IF NOT EXISTS generate_invoice_number
AFTER INSERT ON invoices
FOR EACH ROW
WHEN NEW.invoice_number IS NULL
BEGIN
    UPDATE invoices
    SET invoice_number = 'INV-' || strftime('%Y%m', NEW.issue_date) || '-' ||
        printf('%04d',
            (SELECT COUNT(*) 
             FROM invoices i2 
             WHERE strftime('%Y%m', i2.issue_date) = strftime('%Y%m', NEW.issue_date)
               AND i2.id <= NEW.id)
        )
    WHERE id = NEW.id;
END;
