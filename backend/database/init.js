const { db, runQuery } = require('../config/database');

const initializeDatabase = async () => {
  try {
    // Create patients table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        address TEXT,
        emergency_contact TEXT,
        medical_history TEXT,
        allergies TEXT,
        medications TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        salesforce_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create appointments table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('general', 'follow-up', 'consultation', 'emergency')),
        notes TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'urgent')),
        duration INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )
    `);

    // Create users table for authentication
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'doctor' CHECK (role IN ('admin', 'doctor', 'nurse')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create medical_records table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        record_date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        prescription TEXT,
        notes TEXT,
        doctor_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users (id)
      )
    `);

    // Create indexes for better performance
    await runQuery('CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)');

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };
