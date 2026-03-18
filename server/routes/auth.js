import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    res.json({ token: sign(user._id), user: { id: user._id, username, email } });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user._id), user: { id: user._id, username: user.username, email } });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;