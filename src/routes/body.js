const express = require('express');
const db = require('../models/database');
const router = express.Router();

function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function calculateFatPercentage(weight, fatWeight) {
  return (fatWeight / weight) * 100;
}

router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY timestamp DESC',
    [req.session.userId],
    (err, metrics) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.render('body', { metrics });
    }
  );
});

router.post('/add', (req, res) => {
  const { weight, fatWeight, muscleWeight } = req.body;
  const weightNum = parseFloat(weight);
  const fatWeightNum = parseFloat(fatWeight) || 0;
  const muscleWeightNum = parseFloat(muscleWeight) || 0;
  
  if (isNaN(weightNum)) {
    return res.status(400).send('Weight is required');
  }
  
  db.get(
    'SELECT height FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      let bmi = null;
      if (user && user.height) {
        bmi = calculateBMI(weightNum, user.height);
      }
      
      let fatPercentage = null;
      if (fatWeightNum > 0) {
        fatPercentage = calculateFatPercentage(weightNum, fatWeightNum);
      }
      
      db.run(
        'INSERT INTO body_metrics (user_id, weight, fat_weight, muscle_weight, bmi, fat_percentage) VALUES (?, ?, ?, ?, ?, ?)',
        [req.session.userId, weightNum, fatWeightNum, muscleWeightNum, bmi, fatPercentage],
        function(err) {
          if (err) {
            return res.status(500).send('Error saving body metrics');
          }
          res.redirect('/body');
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