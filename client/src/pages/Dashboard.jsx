import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/habits').then(r => setHabits(r.data)).catch(() => {});
  }, []);

  const createHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    try {
      const { data } = await api.post('/habits', { name: newHabit });
      setHabits([...habits, data]);
      setNewHabit('');
      toast.success('Squad created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const getMyMember = (habit) =>
    habit.members.find(m => m.user?._id === user.id || m.user === user.id);

  const getMyStreak = (habit) => getMyMember(habit)?.streak || 0;

  const checkedToday = (habit) => {
    const m = getMyMember(habit);
    if (!m?.lastCheckin) return false;
    const d = new Date(m.lastCheckin);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  };

  const membersCheckedCount = (habit) =>
    habit.members.filter(m => {
      if (!m.lastCheckin) return false;
      const d = new Date(m.lastCheckin);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    }).length;

  const isCreator = (habit) =>
    habit.creator === user.id ||
    habit.creator?._id === user.id ||
    habit.creator?.toString() === user.id;

  return (
    <>
      <nav>
        <span className="nav-logo">🔥 StreakSquad</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#3b1d8a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '13px', fontWeight: 700,
            color: '#c4b5fd', cursor: 'pointer'
          }} onClick={() => navigate('/profile')}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span style={{ color: '#888', fontSize: '13px' }}>@{user?.username}</span>
          <button className="btn btn-ghost" onClick={() => navigate('/profile')} style={{ padding: '6px 14px' }}>Profile</button>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 14px' }}>Logout</button>
        </div>
      </nav>

      <div className="container">

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Hey {user?.username}! 👋</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>
            You're in {habits.length} squad{habits.length !== 1 ? 's' : ''}
            {habits.length > 0 && ` · ${habits.filter(h => checkedToday(h)).length} checked in today`}
          </p>
        </div>

        {habits.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total squads', value: habits.length, icon: '👥', color: '#7c3aed' },
              { label: 'Best streak', value: Math.max(0, ...habits.map(h => getMyStreak(h))), icon: '🔥', color: '#f97316' },
              { label: 'Done today', value: habits.filter(h => checkedToday(h)).length, icon: '✅', color: '#059669' },
            ].map((s, i) => (
              <div
                key={i}
                className="card"
                style={{ textAlign: 'center', padding: '1rem', cursor: 'default', transition: 'all 0.2s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = s.color;
                  e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}33`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '15px' }}>Create a new squad</h3>
          <form onSubmit={createHabit} style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Habit name (e.g. Exercise daily, Read 20 pages)"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">Create</button>
          </form>
        </div>

        <h3 style={{ fontSize: '15px', color: '#888', marginBottom: '12px', marginTop: '8px' }}>Your squads</h3>

        {habits.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '3rem', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏕️</div>
            <p style={{ fontSize: '15px', marginBottom: '8px' }}>No squads yet</p>
            <p style={{ fontSize: '13px', color: '#555' }}>Create one above and invite your friends!</p>
          </div>
        )}

        {habits.map(habit => {
          const myStreak = getMyStreak(habit);
          const done = checkedToday(habit);
          const checkedCount = membersCheckedCount(habit);
          const totalMembers = habit.members.length;
          const allDone = checkedCount === totalMembers;
          const creator = isCreator(habit);

          return (
            <div
              key={habit._id}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s ease', borderColor: done ? '#065f46' : '#2a2a2a' }}
              onClick={() => navigate(`/squad/${habit._id}`)}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = done ? '#065f46' : '#2a2a2a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{habit.name}</h3>
                    {creator && <span className="badge badge-purple" style={{ fontSize: '10px' }}>owner</span>}
                    {done && <span className="badge badge-green" style={{ fontSize: '10px' }}>done today</span>}
                    {allDone && (
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                        background: '#1c3d2a', color: '#6ee7b7', fontWeight: 500
                      }}>squad complete 🎉</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      <span style={{ color: '#c4b5fd' }}>{totalMembers}</span> member{totalMembers !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      squad streak: <span style={{ color: '#f97316', fontWeight: 600 }}>{habit.squadStreak} 🔥</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>
                      {checkedCount}/{totalMembers} checked in today
                    </div>
                    <div style={{ background: '#2a2a2a', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${totalMembers > 0 ? (checkedCount / totalMembers) * 100 : 0}%`,
                        background: allDone ? '#059669' : '#7c3aed',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {habit.members.map((m, i) => {
                      const mDone = (() => {
                        if (!m.lastCheckin) return false;
                        const d = new Date(m.lastCheckin);
                        const now = new Date();
                        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
                      })();
                      const isMe = m.user?._id === user.id || m.user === user.id;
                      return (
                        <div key={i} title={`${m.user?.username || 'Unknown'} — ${m.streak} day streak`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: mDone ? '#064e3b' : '#1f1f1f',
                            border: `1px solid ${mDone ? '#065f46' : '#2a2a2a'}`,
                            borderRadius: '20px', padding: '3px 10px', fontSize: '12px'
                          }}>
                          <span style={{ color: mDone ? '#6ee7b7' : '#888' }}>
                            {m.user?.username || 'Unknown'}
                            {isMe && <span style={{ color: '#7c3aed' }}> (you)</span>}
                          </span>
                          <span style={{ fontSize: '11px', color: '#f97316' }}>{m.streak}🔥</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginLeft: '1rem', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.8rem' }}>{done ? '✅' : '🔥'}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{myStreak}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>your streak</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}