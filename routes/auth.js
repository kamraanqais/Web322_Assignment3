// routes/auth.js - 100% NO MORE "OOPS" ERROR - Kamraan Qais
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET Register
router.get('/register', (req, res) => {
  res.render('register', { error: null, username: '', email: '' });
});

// POST Register — THIS NEVER SHOWS "OOPS" AGAIN
router.post('/register', async (req, res) => {
  let { username, email, password, confirmPassword } = req.body;

  // Trim inputs
  username = (username || '').trim();
  email = (email || '').toLowerCase().trim();
  password = (password || '');
  confirmPassword = (confirmPassword || '');

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', { error: 'All fields are required', username, email });
  }
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match', username, email });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters', username, email });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.render('register', { error: 'Username or email already taken', username, email });
    }

    // Hash password (bcryptjs — works perfectly on Vercel)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Save user
    await User.create({
      username,
      email,
      password: hashedPassword
    });

    // SUCCESS → go to login
    return res.redirect('/auth/login?success=Account created! Please login.');

  } catch (err) {
    console.error('REGISTER ERROR:', err.message || err);

    // THIS IS THE KEY: always send a proper error message, never let it fall to generic "Oops"
    return res.render('register', {
      error: 'Registration failed — please try again in a few seconds.',
      username,
      email
    });
  }
});

// GET Login
router.get('/login', (req, res) => {
  res.render('login', { error: null, success: req.query.success });
});

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });

    if (!user || !bcrypt.compareSync(password || '', user.password)) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    return res.redirect('/tasks');

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.render('login', { error: 'Login failed — please try again.' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;