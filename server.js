const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

app.use(cors());
app.use(express.json());

// Dummy in-memory database
const users = [];
const posts = [];

// ======================
// SIGNUP
// ======================
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const newUser = { id: Date.now().toString(), username, email, password, created_at: new Date() };
  users.push(newUser);
  res.json({ message: 'Signup successful', user: newUser });
});

// ======================
// LOGIN
// ======================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

// ======================
// GET ALL USERS
// ======================
app.get('/api/users', (req, res) => {
  res.json({ count: users.length, users });
});

// ======================
// GET SINGLE USER BY ID
// ======================
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// ======================
// UPDATE USER PROFILE
// ======================
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, avatarUrl } = req.body;

  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (username) user.username = username;
  if (email) user.email = email;
  if (avatarUrl) user.avatarUrl = avatarUrl;

  res.json({ message: 'Profile updated successfully', user });
});

// ======================
// RESET PASSWORD
// ======================
let resetCodes = {};

app.post('/api/send-reset-code', async (req, res) => {
  const { email } = req.body;
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
    if (error) return res.status(500).json({ message: 'Error sending email' });
    res.json({ message: 'Reset code sent' });
  });
});

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

// ======================
// ROOT ROUTE
// ======================
app.get('/', (req, res) => {
  res.send('Dating App API is running');
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
