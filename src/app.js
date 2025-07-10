require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/database');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const foodRoutes = require('./routes/food');
const bodyRoutes = require('./routes/body');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.use('/', authRoutes);
app.use('/health', requireAuth, healthRoutes);
app.use('/food', requireAuth, foodRoutes);
app.use('/body', requireAuth, bodyRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/settings', requireAuth, settingsRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Health Tracker running on http://localhost:${PORT}`);
});