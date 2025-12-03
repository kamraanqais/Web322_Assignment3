// routes/auth.js - FINAL WORKING REGISTRATION & LOGIN - Kamraan Qais
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET Register Page
router.get('/register', (req, res) => {
  res.render('register', { 
    error: null, 
    username: '', 
    email: '' 
  });
});

// POST Register - 100% WORKING ON VERCEL
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Basic validation
  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', {
      error: 'All fields are required',
      username,
      email
    });
  }

  if (password !== confirmPassword) {
    return res.render('register', {
      error: 'Passwords do not match',
      username,
      email
    });
  }

  if (password.length < 6) {
    return res.render('register', {
      error: 'Password must be at least 6 characters',
      username,
      email
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.render('register', {
        error: 'Username or email already taken',
        username,
        email
      });
    }

    // Create new user with bcryptjs (professor's way)
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    await newUser.save();

    // Success → go to login
    res.redirect('/auth/login?success=Account created successfully! Please login.');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('error', { 
      message: 'Registration failed. Please try again later.' 
    });
  }
});

// GET Login Page
router.get('/login', (req, res) => {
  const success = req.query.success;
  res.render('login', { error: null, success });
});

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Login success
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    res.redirect('/tasks');

  } catch (err) {
    console.error('Login error:', err);
    res.render('error', { message: 'Login failed' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;