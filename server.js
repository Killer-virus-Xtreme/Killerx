const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Dummy in-memory database
const users = [];

// Signup route
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const newUser = { username, email, password, created_at: new Date() };
  users.push(newUser);
  res.json({ message: 'Signup successful', user: newUser });
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});
// npm install nodemailer if not yet installed
const nodemailer = require('nodemailer');

// Mock DB
let resetCodes = {};

// ✅ Send reset code
app.post('/api/send-reset-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[email] = code;

  // Send email with nodemailer
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending email' });
    } else {
      console.log('Email sent: ' + info.response);
      return res.json({ message: 'Reset code sent' });
    }
  });
});

// ✅ Reset password
app.post('/api/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (resetCodes[email] && resetCodes[email] === code) {
    // Update password in DB logic here
    delete resetCodes[email];
    res.json({ message: 'Password reset successful' });
  } else {
    res.status(400).json({ message: 'Invalid code' });
  }
});
// Users route
app.get('/api/users', (req, res) => {
  res.json({ count: users.length, users });
});

// Root route
app.get('/', (req, res) => {
  res.send('Dating App API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
