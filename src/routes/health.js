const express = require('express');
const db = require('../models/database');
const { toStandardUnit, fromStandardUnit } = require('../utils/unitConversion');
const router = express.Router();

function calculateGKI(glucose, ketones) {
  return (glucose / 18) / ketones;
}

router.get('/', (req, res) => {
  // Get user settings first
  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.session.userId],
    (err, settings) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      // Default settings if none exist
      if (!settings) {
        settings = {
          glucose_unit: 'mg/dL',
          ketone_unit: 'mmol/L'
        };
      }
      
      // Get readings
      db.all(
        'SELECT * FROM glucose_readings WHERE user_id = ? ORDER BY timestamp DESC',
        [req.session.userId],
        (err, readings) => {
          if (err) {
            return res.status(500).send('Database error');
          }
          
          // Convert readings to user's preferred units and format appropriately
          const convertedReadings = readings.map(reading => {
            const glucoseConverted = fromStandardUnit(reading.glucose_level, 'glucose', settings.glucose_unit);
            const ketoneConverted = fromStandardUnit(reading.ketone_level, 'ketone', settings.ketone_unit);
            
            return {
              ...reading,
              glucose_level: glucoseConverted,
              ketone_level: ketoneConverted,
              // Format based on units
              glucose_display: settings.glucose_unit === 'mg/dL' 
                ? Math.round(glucoseConverted).toString()
                : glucoseConverted.toFixed(2),
              ketone_display: settings.ketone_unit === 'mg/dL'
                ? Math.round(ketoneConverted).toString()
                : ketoneConverted.toFixed(1)
            };
          });
          
          res.render('health', { 
            readings: convertedReadings,
            settings
          });
        }
      );
    }
  );
});

router.post('/add', (req, res) => {
  const { glucose, ketones, reading_date } = req.body;
  
  // Get user settings to know which units they're using
  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.session.userId],
    (err, settings) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      // Default settings if none exist
      if (!settings) {
        settings = {
          glucose_unit: 'mg/dL',
          ketone_unit: 'mmol/L'
        };
      }
      
      const glucoseLevel = parseFloat(glucose);
      const ketoneLevel = parseFloat(ketones);
      
      if (isNaN(glucoseLevel) || isNaN(ketoneLevel)) {
        return res.status(400).send('Invalid glucose or ketone values');
      }
      
      // Validate and format the custom timestamp
      const readingDate = new Date(reading_date);
      const now = new Date();
      
      if (isNaN(readingDate.getTime())) {
        return res.status(400).send('Invalid date and time');
      }
      
      if (readingDate > now) {
        return res.status(400).send('Reading date cannot be in the future');
      }
      
      // Format timestamp for SQLite (YYYY-MM-DD HH:MM:SS)
      const timestamp = readingDate.toISOString().replace('T', ' ').slice(0, 19);
      
      // Convert to standard units for storage
      const glucoseStandard = toStandardUnit(glucoseLevel, 'glucose', settings.glucose_unit);
      const ketoneStandard = toStandardUnit(ketoneLevel, 'ketone', settings.ketone_unit);
      
      const gki = calculateGKI(glucoseStandard, ketoneStandard);
      
      db.run(
        'INSERT INTO glucose_readings (user_id, glucose_level, ketone_level, gki, timestamp) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, glucoseStandard, ketoneStandard, gki, timestamp],
        function(err) {
          if (err) {
            return res.status(500).send('Error saving reading');
          }
          res.redirect('/health');
        }
      );
    }
  );
});

router.delete('/:id', (req, res) => {
  const readingId = req.params.id;
  
  db.run(
    'DELETE FROM glucose_readings WHERE id = ? AND user_id = ?',
    [readingId, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting reading' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;