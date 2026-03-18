import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import messageRoutes from './routes/messages.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use((req, _, next) => { req.io = io; next(); });

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/messages', messageRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-squad', (habitId) => {
    socket.join(habitId);
    console.log(`Socket ${socket.id} joined squad ${habitId}`);
  });

  socket.on('leave-squad', (habitId) => {
    socket.leave(habitId);
  });

  socket.on('squad-message', ({ roomId, msg }) => {
    console.log(`Message in room ${roomId}:`, msg);
    socket.to(roomId).emit('chat-message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

server.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);