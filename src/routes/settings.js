const express = require('express');
const db = require('../models/database');
const router = express.Router();

router.get('/', (req, res) => {
  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.session.userId],
    (err, settings) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      // If no settings exist, create default settings
      if (!settings) {
        db.run(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [req.session.userId],
          (err) => {
            if (err) {
              return res.status(500).send('Database error');
            }
            
            // Get the newly created settings
            db.get(
              'SELECT * FROM user_settings WHERE user_id = ?',
              [req.session.userId],
              (err, settings) => {
                if (err) {
                  return res.status(500).send('Database error');
                }
                res.render('settings', { settings });
              }
            );
          }
        );
      } else {
        res.render('settings', { settings });
      }
    }
  );
});

router.post('/update', (req, res) => {
  const { glucose_unit, ketone_unit, weight_unit, height_unit } = req.body;
  
  db.run(
    `UPDATE user_settings 
     SET glucose_unit = ?, ketone_unit = ?, weight_unit = ?, height_unit = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [glucose_unit, ketone_unit, weight_unit, height_unit, req.session.userId],
    (err) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.redirect('/settings');
    }
  );
});

module.exports = router;