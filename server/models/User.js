import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

export default mongoose.model('User', userSchema);