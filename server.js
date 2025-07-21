const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Data files
const usersFile = './users.json';
const postsFile = './posts.json';
const chatsFile = './chats.json';

// Load data or initialize
let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : [];
let posts = fs.existsSync(postsFile) ? JSON.parse(fs.readFileSync(postsFile)) : [];
let chats = fs.existsSync(chatsFile) ? JSON.parse(fs.readFileSync(chatsFile)) : [];

// Save functions
const saveUsers = () => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
const savePosts = () => fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
const saveChats = () => fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2));

// Signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, phone } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already registered' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, email, phone, password: hashedPassword, followers: [], following: [], created_at: new Date() };
  users.push(newUser);
  saveUsers();
  res.json({ message: 'Signup successful', user: newUser });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

// Forget password - send reset code
let resetCodes = {};
app.post('/api/send-reset-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[email] = code;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kin37776@gmail.com',
      pass: 'Abby123$'
    }
  });

  const mailOptions = {
    from: 'kin37776@gmail.com',
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

// Reset password
app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (resetCodes[email] && resetCodes[email] === code) {
    const user = users.find(u => u.email === email);
    if (user) {
      user.password = await bcrypt.hash(newPassword, 10);
      saveUsers();
      delete resetCodes[email];
      return res.json({ message: 'Password reset successful' });
    }
  }
  res.status(400).json({ message: 'Invalid code or user not found' });
});

// Follow user
app.post('/api/follow', (req, res) => {
  const { followerId, followeeId } = req.body;
  const follower = users.find(u => u.id === followerId);
  const followee = users.find(u => u.id === followeeId);
  if (!follower || !followee) return res.status(400).json({ message: 'User not found' });

  if (!follower.following.includes(followeeId)) follower.following.push(followeeId);
  if (!followee.followers.includes(followerId)) followee.followers.push(followerId);

  saveUsers();
  res.json({ message: 'Followed successfully' });
});

// Unfollow user
app.post('/api/unfollow', (req, res) => {
  const { followerId, followeeId } = req.body;
  const follower = users.find(u => u.id === followerId);
  const followee = users.find(u => u.id === followeeId);
  if (!follower || !followee) return res.status(400).json({ message: 'User not found' });

  follower.following = follower.following.filter(id => id !== followeeId);
  followee.followers = followee.followers.filter(id => id !== followerId);

  saveUsers();
  res.json({ message: 'Unfollowed successfully' });
});

// Search users/posts
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  const userResults = users.filter(u => u.username.includes(query) || u.email.includes(query));
  const postResults = posts.filter(p => p.caption.includes(query));
  res.json({ users: userResults, posts: postResults });
});

// Create post
app.post('/api/posts', (req, res) => {
  const { userId, caption, image } = req.body;
  const post = { id: Date.now(), userId, caption, image, likes: [], comments: [], created_at: new Date() };
  posts.push(post);
  savePosts();
  res.json({ message: 'Post created', post });
});

// View posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// Like post
app.post('/api/posts/like', (req, res) => {
  const { postId, userId } = req.body;
  const post = posts.find(p => p.id === postId);
  if (!post.likes.includes(userId)) post.likes.push(userId);
  savePosts();
  res.json({ message: 'Post liked' });
});

// Comment on post
app.post('/api/posts/comment', (req, res) => {
  const { postId, userId, comment } = req.body;
  const post = posts.find(p => p.id === postId);
  post.comments.push({ userId, comment, created_at: new Date() });
  savePosts();
  res.json({ message: 'Comment added' });
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  posts = posts.filter(p => p.id !== postId);
  savePosts();
  res.json({ message: 'Post deleted' });
});

// Basic chats
app.post('/api/chats', (req, res) => {
  const { fromId, toId, message } = req.body;
  const chat = { id: Date.now(), fromId, toId, message, created_at: new Date() };
  chats.push(chat);
  saveChats();
  res.json({ message: 'Message sent', chat });
});

app.get('/api/chats', (req, res) => {
  const { userId } = req.query;
  const userChats = chats.filter(c => c.fromId === parseInt(userId) || c.toId === parseInt(userId));
  res.json(userChats);
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
