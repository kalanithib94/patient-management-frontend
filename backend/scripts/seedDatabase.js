const bcrypt = require('bcryptjs');
const { runQuery } = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await runQuery(`
      INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ('admin', 'admin@medicare.com', ?, 'System', 'Administrator', 'admin')
    `, [adminPassword]);
    
    // Create sample doctor user
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    await runQuery(`
      INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ('doctor', 'doctor@medicare.com', ?, 'Dr. Sarah', 'Johnson', 'doctor')
    `, [doctorPassword]);
    
    // Create sample patients
    const patients = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-123-4567',
        dateOfBirth: '1980-05-15',
        address: '123 Main St, New York, NY 10001',
        emergencyContact: 'Jane Smith - +1-555-987-6543',
        medicalHistory: 'Hypertension, Diabetes Type 2',
        allergies: 'Penicillin, Shellfish',
        medications: 'Metformin, Lisinopril',
        status: 'active'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-234-5678',
        dateOfBirth: '1992-08-22',
        address: '456 Oak Ave, Los Angeles, CA 90210',
        emergencyContact: 'Mike Johnson - +1-555-876-5432',
        medicalHistory: 'Asthma, Migraines',
        allergies: 'None',
        medications: 'Albuterol, Sumatriptan',
        status: 'active'
      },
      {
        firstName: 'Michael',
        lastName: 'Wilson',
        email: 'michael.wilson@email.com',
        phone: '+1-555-345-6789',
        dateOfBirth: '1975-12-03',
        address: '789 Pine St, Chicago, IL 60601',
        emergencyContact: 'Lisa Wilson - +1-555-765-4321',
        medicalHistory: 'Cardiovascular Disease, High Cholesterol',
        allergies: 'Aspirin',
        medications: 'Atorvastatin, Metoprolol',
        status: 'active'
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@email.com',
        phone: '+1-555-456-7890',
        dateOfBirth: '1988-03-18',
        address: '321 Elm St, Houston, TX 77001',
        emergencyContact: 'Tom Davis - +1-555-654-3210',
        medicalHistory: 'General Checkup',
        allergies: 'None',
        medications: 'Multivitamin',
        status: 'active'
      },
      {
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@email.com',
        phone: '+1-555-567-8901',
        dateOfBirth: '1965-11-25',
        address: '654 Maple Dr, Phoenix, AZ 85001',
        emergencyContact: 'Mary Brown - +1-555-543-2109',
        medicalHistory: 'Arthritis, Osteoporosis',
        allergies: 'Ibuprofen',
        medications: 'Calcium, Vitamin D, Celecoxib',
        status: 'active'
      },
      {
        firstName: 'Alice',
        lastName: 'Cooper',
        email: 'alice.cooper@email.com',
        phone: '+1-555-678-9012',
        dateOfBirth: '1990-07-12',
        address: '987 Cedar Ln, Miami, FL 33101',
        emergencyContact: 'Bob Cooper - +1-555-432-1098',
        medicalHistory: 'Anxiety, Depression',
        allergies: 'None',
        medications: 'Sertraline, Lorazepam',
        status: 'active'
      },
      {
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@email.com',
        phone: '+1-555-789-0123',
        dateOfBirth: '1983-09-30',
        address: '147 Birch St, Seattle, WA 98101',
        emergencyContact: 'Lisa Lee - +1-555-321-0987',
        medicalHistory: 'Chronic Back Pain',
        allergies: 'Codeine',
        medications: 'Gabapentin, Physical Therapy',
        status: 'active'
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1-555-890-1234',
        dateOfBirth: '1978-04-08',
        address: '258 Spruce Ave, Denver, CO 80201',
        emergencyContact: 'Carlos Garcia - +1-555-210-9876',
        medicalHistory: 'Pregnancy, Gestational Diabetes',
        allergies: 'None',
        medications: 'Prenatal Vitamins, Insulin',
        status: 'active'
      }
    ];
    
    for (const patient of patients) {
      await runQuery(`
        INSERT OR IGNORE INTO patients (
          first_name, last_name, email, phone, date_of_birth,
          address, emergency_contact, medical_history, allergies,
          medications, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patient.firstName, patient.lastName, patient.email, patient.phone,
        patient.dateOfBirth, patient.address, patient.emergencyContact,
        patient.medicalHistory, patient.allergies, patient.medications, patient.status
      ]);
    }
    
    // Create sample appointments
    const appointments = [
      {
        patientId: 1,
        appointmentDate: '2024-01-20',
        appointmentTime: '09:00',
        type: 'general',
        notes: 'Regular checkup and blood pressure monitoring',
        status: 'scheduled',
        duration: 30
      },
      {
        patientId: 2,
        appointmentDate: '2024-01-20',
        appointmentTime: '10:30',
        type: 'follow-up',
        notes: 'Follow-up for diabetes management',
        status: 'confirmed',
        duration: 45
      },
      {
        patientId: 3,
        appointmentDate: '2024-01-21',
        appointmentTime: '14:00',
        type: 'consultation',
        notes: 'Cardiovascular consultation',
        status: 'scheduled',
        duration: 60
      },
      {
        patientId: 4,
        appointmentDate: '2024-01-21',
        appointmentTime: '15:30',
        type: 'emergency',
        notes: 'Urgent consultation - chest pain',
        status: 'urgent',
        duration: 30
      },
      {
        patientId: 5,
        appointmentDate: '2024-01-22',
        appointmentTime: '11:00',
        type: 'follow-up',
        notes: 'Arthritis management follow-up',
        status: 'completed',
        duration: 30
      },
      {
        patientId: 6,
        appointmentDate: '2024-01-23',
        appointmentTime: '13:00',
        type: 'general',
        notes: 'Mental health checkup',
        status: 'scheduled',
        duration: 45
      },
      {
        patientId: 7,
        appointmentDate: '2024-01-24',
        appointmentTime: '16:00',
        type: 'consultation',
        notes: 'Pain management consultation',
        status: 'confirmed',
        duration: 60
      },
      {
        patientId: 8,
        appointmentDate: '2024-01-25',
        appointmentTime: '10:00',
        type: 'general',
        notes: 'Prenatal checkup',
        status: 'scheduled',
        duration: 30
      }
    ];
    
    for (const appointment of appointments) {
      await runQuery(`
        INSERT OR IGNORE INTO appointments (
          patient_id, appointment_date, appointment_time,
          type, notes, status, duration
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        appointment.patientId, appointment.appointmentDate, appointment.appointmentTime,
        appointment.type, appointment.notes, appointment.status, appointment.duration
      ]);
    }
    
    // Create sample medical records
    const medicalRecords = [
      {
        patientId: 1,
        recordDate: '2024-01-15',
        diagnosis: 'Hypertension, Type 2 Diabetes',
        treatment: 'Medication adjustment, lifestyle counseling',
        prescription: 'Metformin 500mg twice daily, Lisinopril 10mg daily',
        notes: 'Patient responding well to treatment. Blood pressure controlled.',
        doctorId: 2
      },
      {
        patientId: 2,
        recordDate: '2024-01-14',
        diagnosis: 'Asthma exacerbation',
        treatment: 'Inhaler adjustment, breathing exercises',
        prescription: 'Albuterol inhaler as needed',
        notes: 'Patient educated on trigger avoidance. Symptoms improved.',
        doctorId: 2
      },
      {
        patientId: 5,
        recordDate: '2024-01-11',
        diagnosis: 'Osteoarthritis, Osteoporosis',
        treatment: 'Pain management, bone density monitoring',
        prescription: 'Celecoxib 200mg daily, Calcium 1200mg daily',
        notes: 'Patient advised on low-impact exercises. Follow-up in 3 months.',
        doctorId: 2
      }
    ];
    
    for (const record of medicalRecords) {
      await runQuery(`
        INSERT OR IGNORE INTO medical_records (
          patient_id, record_date, diagnosis, treatment,
          prescription, notes, doctor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        record.patientId, record.recordDate, record.diagnosis,
        record.treatment, record.prescription, record.notes, record.doctorId
      ]);
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('   - 2 users (admin, doctor)');
    console.log('   - 8 patients');
    console.log('   - 8 appointments');
    console.log('   - 3 medical records');
    console.log('');
    console.log('🔑 Default credentials:');
    console.log('   Admin: admin@medicare.com / admin123');
    console.log('   Doctor: doctor@medicare.com / doctor123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
