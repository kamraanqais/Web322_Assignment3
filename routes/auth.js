// routes/auth.js - FULL WORKING VERSION FOR VERCEL - Kamraan Qais
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');  // ← ONLY bcryptjs, never bcrypt

// GET Register
router.get('/register', (req, res) => {
  res.render('register', { error: null, username: '', email: '' });
});

// POST Register
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

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
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.render('register', {
        error: 'Username or email already taken',
        username,
        email
      });
    }

    // HASH USING bcryptjs (exactly like professor's lab)
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    res.redirect('/auth/login?msg=Account created! Please login.');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('error', {
      message: 'Oops! Something went wrong',
      error: 'Registration failed. Please try again.'
    });
  }
});

// GET Login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // COMPARE USING bcryptjs (exactly like professor's lab)
    const result = bcrypt.compareSync(password, user.password);

    if (result) {
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email
      };
      res.redirect('/tasks');
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('error', { message: 'Oops! Something went wrong' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;