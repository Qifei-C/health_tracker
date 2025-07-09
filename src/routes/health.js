const express = require('express');
const db = require('../models/database');
const router = express.Router();

function calculateGKI(glucose, ketones) {
  return (glucose / 18) / ketones;
}

router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM glucose_readings WHERE user_id = ? ORDER BY timestamp DESC',
    [req.session.userId],
    (err, readings) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.render('health', { readings });
    }
  );
});

router.post('/add', (req, res) => {
  const { glucose, ketones } = req.body;
  const glucoseLevel = parseFloat(glucose);
  const ketoneLevel = parseFloat(ketones);
  
  if (isNaN(glucoseLevel) || isNaN(ketoneLevel)) {
    return res.status(400).send('Invalid glucose or ketone values');
  }
  
  const gki = calculateGKI(glucoseLevel, ketoneLevel);
  
  db.run(
    'INSERT INTO glucose_readings (user_id, glucose_level, ketone_level, gki) VALUES (?, ?, ?, ?)',
    [req.session.userId, glucoseLevel, ketoneLevel, gki],
    function(err) {
      if (err) {
        return res.status(500).send('Error saving reading');
      }
      res.redirect('/health');
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