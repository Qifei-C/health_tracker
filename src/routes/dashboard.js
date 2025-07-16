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
  const { type, period = 'daily' } = req.query;
  
  if (type === 'glucose') {
    let query;
    let params = [req.session.userId];
    
    if (period === 'daily') {
      // Return all daily data
      query = 'SELECT glucose_level, ketone_level, gki, timestamp FROM glucose_readings WHERE user_id = ? ORDER BY timestamp ASC';
    } else if (period === 'weekly') {
      // Return all readings with week grouping info
      query = `
        SELECT 
          glucose_level,
          ketone_level,
          gki,
          timestamp,
          strftime('%Y-%m-%d', timestamp, 'weekday 0', '-6 days') as week_start
        FROM glucose_readings 
        WHERE user_id = ? 
        ORDER BY timestamp ASC
      `;
    } else if (period === 'monthly') {
      // Return all readings with month grouping info
      query = `
        SELECT 
          glucose_level,
          ketone_level,
          gki,
          timestamp,
          substr(timestamp, 1, 7) || '-01' as month_start
        FROM glucose_readings 
        WHERE user_id = ? 
        ORDER BY timestamp ASC
      `;
    }
    
    db.all(query, params, (err, readings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Process data for weekly/monthly views
      if (period === 'weekly' || period === 'monthly') {
        const groupKey = period === 'weekly' ? 'week_start' : 'month_start';
        const grouped = {};
        
        console.log(`First few ${period} readings:`, readings.slice(0, 5).map(r => ({
          timestamp: r.timestamp,
          [groupKey]: r[groupKey]
        })));
        
        // Group readings by period
        readings.forEach(reading => {
          const key = reading[groupKey];
          if (!grouped[key]) {
            grouped[key] = {
              timestamp: key,
              glucose_values: [],
              ketone_values: [],
              gki_values: []
            };
          }
          grouped[key].glucose_values.push(reading.glucose_level);
          grouped[key].ketone_values.push(reading.ketone_level);
          grouped[key].gki_values.push(reading.gki);
        });
        
        // Calculate statistics for each period
        const processedData = Object.values(grouped).map(group => {
          const calculateStats = (values) => {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            return {
              mean: mean,
              stdDev: stdDev || mean * 0.1, // Fallback if only one value
              min: Math.min(...values),
              max: Math.max(...values),
              values: values
            };
          };
          
          return {
            timestamp: group.timestamp,
            glucose_stats: calculateStats(group.glucose_values),
            ketone_stats: calculateStats(group.ketone_values),
            gki_stats: calculateStats(group.gki_values),
            count: group.glucose_values.length
          };
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log(`Processed data length for ${period}:`, processedData.length);
        
        // For monthly view, fill in missing months
        if (period === 'monthly') {
          if (processedData.length === 0) {
            console.log('No processed data for monthly view! Grouped keys:', Object.keys(grouped));
            // If no data, return empty array
            return res.json([]);
          }
          console.log('ProcessedData for monthly:', processedData);
          console.log('Grouped data keys:', Object.keys(grouped));
          
          const firstDate = new Date(processedData[0].timestamp);
          const lastDate = new Date(processedData[processedData.length - 1].timestamp);
          console.log('Date range:', firstDate, 'to', lastDate);
          const filledData = [];
          
          // Start from 3 months before first data
          const startDate = new Date(firstDate);
          startDate.setMonth(startDate.getMonth() - 3);
          startDate.setDate(1); // Ensure we're at the start of the month
          
          // End at the last month that has data, plus one month
          const endDate = new Date(lastDate);
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(1);
          
          // Create a map of existing data by month for faster lookup
          const dataByMonth = new Map();
          processedData.forEach(d => {
            const monthKey = d.timestamp.slice(0, 7);
            dataByMonth.set(monthKey, d);
          });
          
          // Generate all months
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const monthKey = currentDate.toISOString().slice(0, 7);
            const existingData = dataByMonth.get(monthKey);
            
            if (existingData) {
              filledData.push(existingData);
            } else {
              // Add empty month
              filledData.push({
                timestamp: monthKey + '-01',
                glucose_stats: null,
                ketone_stats: null,
                gki_stats: null,
                count: 0
              });
            }
            
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          console.log('FilledData for monthly:', filledData);
          return res.json(filledData);
        }
        
        res.json(processedData);
      } else {
        res.json(readings);
      }
    });
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