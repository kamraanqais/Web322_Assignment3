const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register
router.get('/register', (req, res) => {
  res.render('register', { error: null, username: '', email: '' });
});

router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match', username, email });
  }

  try {
    const existing = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });

    if (existing) {
      return res.render('register', { error: 'Username or email already taken', username, email });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    res.redirect('/auth/login?success=Registered successfully!');
  } catch (err) {
    console.error('Register error:', err);
    res.render('error', { message: 'Registration failed. Try域名 again.' });
  }
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    res.redirect('/tasks');
  } catch (err) {
    res.render('error', { message: 'Login failed' });
  }
});

router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;