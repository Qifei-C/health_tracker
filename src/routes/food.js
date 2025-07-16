const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../models/database');
const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;
  
  // Get total count for pagination
  db.get(
    'SELECT COUNT(*) as total FROM food_items WHERE user_id = ? OR user_id IS NULL',
    [req.session.userId],
    (err, countResult) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      const totalRecords = countResult.total;
      const totalPages = Math.ceil(totalRecords / limit);
      
      // Get food items with pagination
      db.all(
        'SELECT * FROM food_items WHERE user_id = ? OR user_id IS NULL ORDER BY name LIMIT ? OFFSET ?',
        [req.session.userId, limit, offset],
        (err, foodItems) => {
          if (err) {
            return res.status(500).send('Database error');
          }
          res.render('food', { 
            foodItems,
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords
          });
        }
      );
    }
  );
});

router.post('/add', (req, res) => {
  const { name, weight, calories } = req.body;
  
  if (!name || !weight || !calories) {
    return res.status(400).send('All fields are required');
  }
  
  db.run(
    'INSERT INTO food_items (name, weight, calories, user_id) VALUES (?, ?, ?, ?)',
    [name, parseFloat(weight), parseFloat(calories), req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).send('Error adding food item');
      }
      res.redirect('/food');
    }
  );
});

router.post('/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  
  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      if (data.name && data.weight && data.calories) {
        results.push({
          name: data.name,
          weight: parseFloat(data.weight),
          calories: parseFloat(data.calories)
        });
      }
    })
    .on('end', () => {
      const stmt = db.prepare('INSERT INTO food_items (name, weight, calories, user_id) VALUES (?, ?, ?, ?)');
      
      results.forEach(item => {
        stmt.run(item.name, item.weight, item.calories, req.session.userId);
      });
      
      stmt.finalize();
      
      fs.unlinkSync(req.file.path);
      res.redirect('/food');
    });
});

router.get('/meals', (req, res) => {
  db.all(
    `SELECT m.*, GROUP_CONCAT(fi.name || ' (' || mi.quantity || 'g)') as foods
     FROM meals m
     LEFT JOIN meal_items mi ON m.id = mi.meal_id
     LEFT JOIN food_items fi ON mi.food_item_id = fi.id
     WHERE m.user_id = ?
     GROUP BY m.id
     ORDER BY m.timestamp DESC`,
    [req.session.userId],
    (err, meals) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.render('meals', { meals });
    }
  );
});

router.post('/meals/add', (req, res) => {
  const { mealType, foodItems } = req.body;
  
  if (!mealType || !foodItems || !Array.isArray(foodItems)) {
    return res.status(400).send('Invalid meal data');
  }
  
  db.run(
    'INSERT INTO meals (user_id, meal_type) VALUES (?, ?)',
    [req.session.userId, mealType],
    function(err) {
      if (err) {
        return res.status(500).send('Error creating meal');
      }
      
      const mealId = this.lastID;
      const stmt = db.prepare('INSERT INTO meal_items (meal_id, food_item_id, quantity) VALUES (?, ?, ?)');
      
      foodItems.forEach(item => {
        stmt.run(mealId, item.foodId, item.quantity);
      });
      
      stmt.finalize();
      res.redirect('/food/meals');
    }
  );
});

module.exports = router;