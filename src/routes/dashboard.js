const express = require('express');
const db = require('../models/database');
const router = express.Router();

router.get('/', (req, res) => {
  const queries = [
    new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM glucose_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT 30',
        [req.session.userId],
        (err, readings) => {
          if (err) reject(err);
          else resolve(readings);
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY timestamp DESC LIMIT 30',
        [req.session.userId],
        (err, metrics) => {
          if (err) reject(err);
          else resolve(metrics);
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.all(
        `SELECT m.*, GROUP_CONCAT(fi.name || ' (' || mi.quantity || 'g)') as foods
         FROM meals m
         LEFT JOIN meal_items mi ON m.id = mi.meal_id
         LEFT JOIN food_items fi ON mi.food_item_id = fi.id
         WHERE m.user_id = ?
         GROUP BY m.id
         ORDER BY m.timestamp DESC LIMIT 10`,
        [req.session.userId],
        (err, meals) => {
          if (err) reject(err);
          else resolve(meals);
        }
      );
    })
  ];
  
  Promise.all(queries)
    .then(([readings, metrics, meals]) => {
      res.render('dashboard', {
        readings,
        metrics,
        meals,
        username: req.session.username
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Database error');
    });
});

router.get('/api/chart-data', (req, res) => {
  const { type } = req.query;
  
  if (type === 'glucose') {
    db.all(
      'SELECT glucose_level, ketone_level, gki, timestamp FROM glucose_readings WHERE user_id = ? ORDER BY timestamp ASC',
      [req.session.userId],
      (err, readings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(readings);
      }
    );
  } else if (type === 'body') {
    db.all(
      'SELECT weight, fat_weight, muscle_weight, bmi, fat_percentage, timestamp FROM body_metrics WHERE user_id = ? ORDER BY timestamp ASC',
      [req.session.userId],
      (err, metrics) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(metrics);
      }
    );
  } else {
    res.status(400).json({ error: 'Invalid chart type' });
  }
});

module.exports = router;