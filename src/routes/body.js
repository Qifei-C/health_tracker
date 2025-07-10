const express = require('express');
const db = require('../models/database');
const { toStandardUnit, fromStandardUnit } = require('../utils/unitConversion');
const router = express.Router();

function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function calculateFatPercentage(weight, fatWeight) {
  return (fatWeight / weight) * 100;
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
          weight_unit: 'kg'
        };
      }
      
      // Get metrics
      db.all(
        'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY timestamp DESC',
        [req.session.userId],
        (err, metrics) => {
          if (err) {
            return res.status(500).send('Database error');
          }
          
          // Convert metrics to user's preferred units
          const convertedMetrics = metrics.map(metric => ({
            ...metric,
            weight: fromStandardUnit(metric.weight, 'weight', settings.weight_unit),
            fat_weight: metric.fat_weight ? fromStandardUnit(metric.fat_weight, 'weight', settings.weight_unit) : null,
            muscle_weight: metric.muscle_weight ? fromStandardUnit(metric.muscle_weight, 'weight', settings.weight_unit) : null
          }));
          
          res.render('body', { 
            metrics: convertedMetrics,
            settings
          });
        }
      );
    }
  );
});

router.post('/add', (req, res) => {
  const { weight, fatWeight, muscleWeight } = req.body;
  
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
          weight_unit: 'kg'
        };
      }
      
      const weightNum = parseFloat(weight);
      const fatWeightNum = parseFloat(fatWeight) || 0;
      const muscleWeightNum = parseFloat(muscleWeight) || 0;
      
      if (isNaN(weightNum)) {
        return res.status(400).send('Weight is required');
      }
      
      // Convert to standard units for storage
      const weightStandard = toStandardUnit(weightNum, 'weight', settings.weight_unit);
      const fatWeightStandard = fatWeightNum > 0 ? toStandardUnit(fatWeightNum, 'weight', settings.weight_unit) : 0;
      const muscleWeightStandard = muscleWeightNum > 0 ? toStandardUnit(muscleWeightNum, 'weight', settings.weight_unit) : 0;
      
      db.get(
        'SELECT height FROM users WHERE id = ?',
        [req.session.userId],
        (err, user) => {
          if (err) {
            return res.status(500).send('Database error');
          }
          
          let bmi = null;
          if (user && user.height) {
            bmi = calculateBMI(weightStandard, user.height);
          }
          
          let fatPercentage = null;
          if (fatWeightStandard > 0) {
            fatPercentage = calculateFatPercentage(weightStandard, fatWeightStandard);
          }
          
          db.run(
            'INSERT INTO body_metrics (user_id, weight, fat_weight, muscle_weight, bmi, fat_percentage) VALUES (?, ?, ?, ?, ?, ?)',
            [req.session.userId, weightStandard, fatWeightStandard, muscleWeightStandard, bmi, fatPercentage],
            function(err) {
              if (err) {
                return res.status(500).send('Error saving body metrics');
              }
              res.redirect('/body');
            }
          );
        }
      );
    }
  );
});

router.delete('/:id', (req, res) => {
  const metricId = req.params.id;
  
  db.run(
    'DELETE FROM body_metrics WHERE id = ? AND user_id = ?',
    [metricId, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting metric' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;