import express from 'express';
import Habit from '../models/Habit.js';
import User from '../models/User.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
};

router.get('/', verifyJWT, async (req, res) => {
  const habits = await Habit.find({ 'members.user': req.user.id })
    .populate('members.user', 'username');
  res.json(habits);
});

router.post('/', verifyJWT, async (req, res) => {
  try {
    const { name } = req.body;
    const habit = await Habit.create({
      name,
      creator: req.user.id,
      members: [{ user: req.user.id, streak: 0 }],
    });
    await habit.populate('members.user', 'username');
    res.json(habit);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/invite', verifyJWT, async (req, res) => {
  try {
    const { username } = req.body;
    const invitee = await User.findOne({ username });
    if (!invitee) return res.status(404).json({ message: 'User not found' });
    const habit = await Habit.findById(req.params.id);
    const already = habit.members.some(m => m.user.toString() === invitee._id.toString());
    if (already) return res.status(400).json({ message: 'Already a member' });
    habit.members.push({ user: invitee._id, streak: 0 });
    await habit.save();
    await habit.populate('members.user', 'username');
    res.json(habit);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/checkin', verifyJWT, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    const member = habit.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a member' });
    if (isToday(member.lastCheckin))
      return res.status(400).json({ message: 'Already checked in today' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = member.lastCheckin &&
      new Date(member.lastCheckin).toDateString() === yesterday.toDateString();

    member.streak = wasYesterday ? member.streak + 1 : 1;
    member.lastCheckin = new Date();
    member.checkedToday = true;

    const allChecked = habit.members.every(m =>
      m.user.toString() === req.user.id ? true : isToday(m.lastCheckin)
    );
    if (allChecked) habit.squadStreak += 1;

    await habit.save();
    await habit.populate('members.user', 'username');

    req.io.to(habit._id.toString()).emit('checkin', {
      habitId: habit._id,
      username: req.body.username,
      streak: member.streak,
      habit,
    });

    res.json(habit);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;