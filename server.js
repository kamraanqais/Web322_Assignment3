// server.js - Kamraan Qais - WEB322 Assignment 3
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