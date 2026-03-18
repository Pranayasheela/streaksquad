# 🔥 StreakSquad

A real-time social habit tracker where squads win or lose together.

## Features
- 🔥 Create habit squads and invite friends by username
- ✅ Daily check-in with streak tracking
- 💬 Real-time squad chat (Socket.io)
- 📊 Live notifications when squad members check in
- 🏆 Squad leaderboard with individual streaks
- 📅 14-day streak history calendar
- ⚠️ Streak at risk warning when members haven't checked in
- 🔐 JWT authentication

## Tech Stack
- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally

### Installation

cd server
npm install
npm run dev

cd client
npm install
npm run dev

### Environment Variables
Create server/.env:

PORT=5000
MONGO_URI=mongodb://localhost:27017/streaksquad
JWT_SECRET=streaksquad_secret_2024
CLIENT_URL=http://localhost:5173

Open http://localhost:5173

## How it works
1. Register an account
2. Create a habit squad
3. Invite friends by username
4. Check in every day to keep the squad streak alive
5. If anyone misses a day the whole squad loses their streak
6. Chat with your squad in real time to stay motivated