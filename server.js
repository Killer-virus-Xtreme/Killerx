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
