const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.render('login', { error: 'Database error' });
    }
    
    if (!user) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    bcrypt.compare(password, user.password_hash, (err, match) => {
      if (err) {
        return res.render('login', { error: 'Authentication error' });
      }
      
      if (match) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/dashboard');
      } else {
        res.render('login', { error: 'Invalid username or password' });
      }
    });
  });
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', (req, res) => {
  const { username, password, age, height } = req.body;
  
  if (!username || !password) {
    return res.render('register', { error: 'Username and password are required' });
  }
  
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.render('register', { error: 'Error creating account' });
    }
    
    db.run(
      'INSERT INTO users (username, password_hash, age, height) VALUES (?, ?, ?, ?)',
      [username, hash, age || null, height || null],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.render('register', { error: 'Username already exists' });
          }
          return res.render('register', { error: 'Error creating account' });
        }
        
        req.session.userId = this.lastID;
        req.session.username = username;
        res.redirect('/dashboard');
      }
    );
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;