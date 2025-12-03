require('dotenv').config();           // ← Loads .env (local only)
require('pg');                        // ← Fixes Sequelize "install pg manually" on Vercel

const express = require('express');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');  // ← Modern import (same as require('sequelize'))
const session = require('client-sessions');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// 1. MongoDB (Mongoose) – Users
// ──────────────────────────────────────────────
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing!');
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected (Users)'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────
// 2. PostgreSQL (Sequelize + Neon) – Tasks
// ──────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),       // ← THIS FIXES the Vercel crash 100%
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: { max: 1, min: 0, idle: 10000, acquire: 30000 }
});

// Test connections on startup
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected (Tasks)'))
  .catch(err => {
    console.error('PostgreSQL connection error:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────
// Middleware & Rest of your app continues below...
// ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || 'web322-secret-key-change-in-production',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  ephemeral: false
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));

app.get('/', (req, res) => {
  req.session.user ? res.redirect('/dashboard') : res.render('index', { title: 'Home' });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('dashboard', { title: 'Dashboard' });
});

app.use((req, res) => res.status(404).render('error', { title: '404', message: 'Page not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;