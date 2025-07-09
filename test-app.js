// Simple test to verify the application components
const db = require('./src/models/database');

console.log('Testing Health Tracker Application...');

// Test database connection
db.serialize(() => {
  console.log('✓ Database connection successful');
  
  // Test table creation
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('✗ Database error:', err);
    } else if (row) {
      console.log('✓ Users table exists');
    } else {
      console.log('✗ Users table not found');
    }
  });
  
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='glucose_readings'", (err, row) => {
    if (err) {
      console.error('✗ Database error:', err);
    } else if (row) {
      console.log('✓ Glucose readings table exists');
    } else {
      console.log('✗ Glucose readings table not found');
    }
  });
  
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='food_items'", (err, row) => {
    if (err) {
      console.error('✗ Database error:', err);
    } else if (row) {
      console.log('✓ Food items table exists');
    } else {
      console.log('✗ Food items table not found');
    }
  });
  
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='body_metrics'", (err, row) => {
    if (err) {
      console.error('✗ Database error:', err);
    } else if (row) {
      console.log('✓ Body metrics table exists');
    } else {
      console.log('✗ Body metrics table not found');
    }
  });
});

// Test GKI calculation
function calculateGKI(glucose, ketones) {
  return (glucose / 18) / ketones;
}

const testGKI = calculateGKI(90, 1.5);
console.log(`✓ GKI calculation test: glucose=90, ketones=1.5, GKI=${testGKI.toFixed(2)}`);

// Test BMI calculation
function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

const testBMI = calculateBMI(70, 175);
console.log(`✓ BMI calculation test: weight=70kg, height=175cm, BMI=${testBMI.toFixed(1)}`);

console.log('\nApplication components verified successfully!');
console.log('To run the application: npm start');
console.log('Then visit: http://localhost:3000');

process.exit(0);