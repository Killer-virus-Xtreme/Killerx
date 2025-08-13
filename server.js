const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid'); // For generating unique user IDs

const app = express();
app.use(cors());
app.use(express.json());

// In-memory DB
const users = [];
const posts = [];
let resetCodes = {};

// ===== AUTH ROUTES =====

// Signup
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const newUser = {
    id: uuidv4(),
    username,
    email,
    password,
    created_at: new Date(),
    posts: []
  };

  users.push(newUser);
  res.json({ message: 'Signup successful', user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

// Get single user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({ count: users.length, users });
});

// ===== PASSWORD RESET =====

// Send reset code
app.post('/api/send-reset-code', async (req, res) => {
  const { email } = req.body;
  if (!users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email not found' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[email] = code;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your@gmail.com',
      pass: 'yourpassword'
    }
  });

  const mailOptions = {
    from: 'your@gmail.com',
    to: email,
    subject: 'Password Reset Code',
    text: `Your password reset code is ${code}`
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending email' });
    } else {
      return res.json({ message: 'Reset code sent' });
    }
  });
});

// Reset password
app.post('/api/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (resetCodes[email] && resetCodes[email] === code) {
    const user = users.find(u => u.email === email);
    if (user) {
      user.password = newPassword;
    }
    delete resetCodes[email];
    res.json({ message: 'Password reset successful' });
  } else {
    res.status(400).json({ message: 'Invalid code' });
  }
});

// ===== POSTS =====

// Create post
app.post('/api/posts', (req, res) => {
  const { userId, caption } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const post = {
    id: uuidv4(),
    userId,
    username: user.username,
    caption,
    likes: [],
    comments: [],
    created_at: new Date()
  };
  posts.push(post);
  user.posts.push(post.id);
  res.json(post);
});

// Get all posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// ===== ROOT =====
app.get('/', (req, res) => {
  res.send('Dating App API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
