require('dotenv').config();
require('pg'); // fixes the "install pg manually" warning

const express = require('express');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const session = require('client-sessions');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MongoDB – Users (Mongoose)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// 2. PostgreSQL – Tasks (Sequelize) – MINIMAL config that works on Vercel
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),     // ← only line needed to fix pg error
  logging: false
});

// Simple test (does NOT crash Vercel)
sequelize.authenticate().catch(err => console.error('DB Error:', err));

// ────── Everything below stays exactly like your friend’s ──────
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || 'supersecret',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));

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