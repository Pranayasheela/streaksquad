import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    api.get('/habits').then(r => setHabits(r.data));
  }, []);

  const totalSquads = habits.length;
  const bestStreak = Math.max(0, ...habits.map(h => {
    const m = h.members.find(m => m.user._id === user.id || m.user === user.id);
    return m?.streak || 0;
  }));
  const totalCheckins = habits.reduce((sum, h) => {
    const m = h.members.find(m => m.user._id === user.id || m.user === user.id);
    return sum + (m?.streak || 0);
  }, 0);

  return (
    <>
      <nav>
        <span className="nav-logo">🔥 StreakSquad</span>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '6px 14px' }}>Back</button>
      </nav>
      <div className="container">

        <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#3b1d8a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem',
            fontSize: '1.8rem', fontWeight: 700, color: '#c4b5fd'
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.4rem' }}>@{user?.username}</h2>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{user?.email}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Squads', value: totalSquads, icon: '👥' },
            { label: 'Best streak', value: bestStreak, icon: '🔥' },
            { label: 'Total days', value: totalCheckins, icon: '📅' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7c3aed' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Your Squads</h3>
          {habits.map(h => {
            const m = h.members.find(m => m.user._id === user.id || m.user === user.id);
            return (
              <div key={h._id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #2a2a2a',
                cursor: 'pointer'
              }} onClick={() => navigate(`/squad/${h._id}`)}>
                <span>{h.name}</span>
                <span style={{ color: '#f97316', fontWeight: 600 }}>{m?.streak || 0} 🔥</span>
              </div>
            );
          })}
        </div>

        <button className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { logout(); navigate('/auth'); }}>
          Logout
        </button>
      </div>
    </>
  );
}