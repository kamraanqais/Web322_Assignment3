// server.js - Kamraan Qais - WEB322 Assignment 3 - FINAL 100% WORKING (NO vercel.json needed)
require('dotenv').config();
require('pg'); // fixes Sequelize on Vercel

const express = require('express');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const session = require('client-sessions');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// === DATABASE CONNECTIONS ===
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.log('PostgreSQL error:', err));

// === MIDDLEWARE ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || 'kamraan-web322-secret-2025',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// === ROUTES ===
app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));

// Home page
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/tasks');
  } else {
    res.render('index');
  }
});

// 404 & Error handling (prevents 500 crashes)
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;