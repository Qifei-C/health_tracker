const express = require('express');
const db = require('../models/database');
const bcrypt = require('bcryptjs');
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
                res.render('settings', { settings, username: req.session.username });
              }
            );
          }
        );
      } else {
        res.render('settings', { settings, username: req.session.username });
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

router.post('/account', async (req, res) => {
  const { username, current_password, new_password, confirm_password } = req.body;
  
  try {
    // Get current user data
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [req.session.userId],
      async (err, user) => {
        if (err) {
          return res.status(500).send('Database error');
        }
        
        // Check if username is being changed and if it's already taken
        if (username !== user.username) {
          db.get(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, req.session.userId],
            async (err, existingUser) => {
              if (err) {
                return res.status(500).send('Database error');
              }
              
              if (existingUser) {
                return res.status(400).send('Username already taken');
              }
              
              // Update username
              updateUser();
            }
          );
        } else {
          updateUser();
        }
        
        async function updateUser() {
          let updateQuery = 'UPDATE users SET username = ?';
          let updateParams = [username];
          
          // If password is being changed
          if (new_password) {
            // Verify current password
            const validPassword = await bcrypt.compare(current_password, user.password_hash);
            if (!validPassword) {
              return res.status(400).send('Current password is incorrect');
            }
            
            // Check if new passwords match
            if (new_password !== confirm_password) {
              return res.status(400).send('New passwords do not match');
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);
            updateQuery += ', password_hash = ?';
            updateParams.push(hashedPassword);
          }
          
          updateQuery += ' WHERE id = ?';
          updateParams.push(req.session.userId);
          
          db.run(updateQuery, updateParams, (err) => {
            if (err) {
              return res.status(500).send('Error updating account');
            }
            
            // Update session username
            req.session.username = username;
            res.redirect('/settings');
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;