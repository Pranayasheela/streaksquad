import express from 'express';
import Message from '../models/Message.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/:habitId', verifyJWT, async (req, res) => {
  try {
    const messages = await Message.find({ habitId: req.params.habitId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:habitId', verifyJWT, async (req, res) => {
  try {
    const { text, username, time } = req.body;
    const msg = await Message.create({
      habitId: req.params.habitId,
      username,
      text,
      time,
    });
    res.json(msg);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;