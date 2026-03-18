import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  habitId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  username: { type: String, required: true },
  text:     { type: String, required: true },
  time:     { type: String },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);