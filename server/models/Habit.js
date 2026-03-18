import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  streak:       { type: Number, default: 0 },
  lastCheckin:  { type: Date, default: null },
  checkedToday: { type: Boolean, default: false },
});

const habitSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:     [memberSchema],
  squadStreak: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);