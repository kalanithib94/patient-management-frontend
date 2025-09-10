const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, '..', 'database', 'patient_management.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing database schema...');

// Check if salesforce_id column exists
db.get("PRAGMA table_info(patients)", (err, row) => {
  if (err) {
    console.error('❌ Error checking table schema:', err);
    process.exit(1);
  }

  // Add salesforce_id column if it doesn't exist
  db.run(`
    ALTER TABLE patients 
    ADD COLUMN salesforce_id TEXT
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ salesforce_id column already exists');
      } else {
        console.error('❌ Error adding column:', err.message);
      }
    } else {
      console.log('✅ Added salesforce_id column to patients table');
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database schema fixed successfully!');
      }
    });
  });
});
