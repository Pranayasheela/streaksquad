import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const CalendarGrid = ({ streak }) => {
  const total = 14;
  const days = Array.from({ length: total }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (total - 1 - i));
    return { date: d, checked: i >= total - streak };
  });
  const today = new Date().toDateString();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <p style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>Last 14 days</p>
      <div style={{ display: 'flex', gap: '3px' }}>
        {days.map((d, i) => (
          <div
            key={i}
            title={d.date.toDateString()}
            style={{
              width: '14px', height: '14px', borderRadius: '3px',
              background: d.checked ? '#059669' : '#2a2a2a',
              outline: d.date.toDateString() === today ? '2px solid #7c3aed' : 'none',
              outlineOffset: '1px',
              boxShadow: d.checked ? '0 0 4px rgba(5,150,105,0.5)' : 'none',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: '#555', marginTop: '2px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#2a2a2a', display: 'inline-block' }} />
          Missed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#059669', display: 'inline-block' }} />
          Done
        </span>
      </div>
    </div>
  );
};

export default function Squad() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [invite, setInvite] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    api.get('/habits').then(r => {
      const h = r.data.find(h => h._id === id);
      if (h) setHabit(h);
    });

    api.get(`/messages/${id}`).then(r => {
      const loaded = r.data.map(m => ({ ...m, mine: m.username === user.username }));
      setMessages(loaded);
    }).catch(() => {});

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-squad', id);
    });

    socketRef.current.on('checkin', ({ habit }) => {
      setHabit(habit);
      toast.success('A squad member just checked in! 🔥', {
        style: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #059669' }
      });
    });

    socketRef.current.on('chat-message', (msg) => {
      setMessages(prev => [...prev, { ...msg, mine: false }]);
    });

    return () => {
      socketRef.current.emit('leave-squad', id);
      socketRef.current.disconnect();
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkin = async () => {
    try {
      const { data } = await api.post(`/habits/${id}/checkin`, { username: user.username });
      setHabit(data);
      const myMember = data.members.find(m => m.user._id === user.id || m.user === user.id);
      toast.success(`🔥 ${myMember?.streak} day streak! Keep it up!`, {
        duration: 3000,
        style: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #7c3aed' }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/habits/${id}/invite`, { username: invite });
      setHabit(data);
      setInvite('');
      toast.success(`${invite} added to squad!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = { username: user.username, text: chatInput, time };
    try { await api.post(`/messages/${id}`, msg); } catch {}
    socketRef.current?.emit('squad-message', { roomId: id, msg });
    setMessages(prev => [...prev, { ...msg, mine: true }]);
    setChatInput('');
  };

  const deleteMessage = (index) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  const isCheckedToday = () => {
    if (!habit) return false;
    const m = habit.members.find(m => m.user._id === user.id || m.user === user.id);
    if (!m?.lastCheckin) return false;
    const d = new Date(m.lastCheckin);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  };

  const getMyStreak = () => {
    if (!habit) return 0;
    const m = habit.members.find(m => m.user._id === user.id || m.user === user.id);
    return m?.streak || 0;
  };

  const memberCheckedToday = (m) => {
    if (!m?.lastCheckin) return false;
    const d = new Date(m.lastCheckin);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  };

  if (!habit) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔥</div>
        <div>Loading squad...</div>
      </div>
    </div>
  );

  const sorted = [...habit.members].sort((a, b) => b.streak - a.streak);
  const anyNotDone = habit.members.some(m => !memberCheckedToday(m));
  const checkedCount = habit.members.filter(m => memberCheckedToday(m)).length;
  const totalMembers = habit.members.length;

  return (
    <>
      <nav>
        <span className="nav-logo">🔥 StreakSquad</span>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '6px 14px' }}>← Back</button>
      </nav>

      <div className="container">

        {anyNotDone && (
          <div className="slide-in" style={{
            background: '#7f1d1d', border: '1px solid #dc2626',
            borderRadius: '12px', padding: '1rem 1.5rem',
            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: '#fca5a5' }}>Squad streak at risk!</div>
              <div style={{ fontSize: '13px', color: '#f87171', marginTop: '2px' }}>
                {checkedCount}/{totalMembers} members checked in — don't break the chain!
              </div>
            </div>
          </div>
        )}

        {/* Main streak widget */}
        <div style={{
          background: 'linear-gradient(135deg, #1c0a00, #1a0030)',
          border: '1px solid #3b1d8a',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="fire-icon">🔥</span>
              <div className="streak-count" key={getMyStreak()}>{getMyStreak()}</div>
              <div style={{ fontSize: '11px', color: '#f97316' }}>day streak</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#f0f0f0', marginBottom: '4px' }}>
                {habit.name}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                Squad streak: <span style={{ color: '#f97316', fontWeight: 600 }}>{habit.squadStreak} 🔥</span>
                &nbsp;·&nbsp;
                <span style={{ color: '#c4b5fd' }}>{totalMembers} members</span>
              </div>
              <CalendarGrid streak={getMyStreak()} />
            </div>
          </div>

          <button
            className={`btn ${isCheckedToday() ? 'btn-ghost' : 'btn-success'}`}
            style={{
              fontSize: '13px', padding: '8px 20px',
              borderRadius: '20px', fontWeight: 600,
              transition: 'all 0.2s ease', flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={checkin}
            disabled={isCheckedToday()}
            onMouseEnter={e => {
              if (!isCheckedToday()) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(5,150,105,0.4)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isCheckedToday() ? '✅ Done!' : '🔥 Check In'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
            <span>Squad progress today</span>
            <span style={{ color: checkedCount === totalMembers ? '#6ee7b7' : '#f97316' }}>
              {checkedCount}/{totalMembers} checked in
            </span>
          </div>
          <div style={{ background: '#2a2a2a', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${totalMembers > 0 ? (checkedCount / totalMembers) * 100 : 0}%`,
              background: checkedCount === totalMembers
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              borderRadius: '6px',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Leaderboard
            <span style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>· today's status</span>
          </h3>
          {sorted.map((m, i) => (
            <div
              key={m._id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 8px',
                borderBottom: i < sorted.length - 1 ? '1px solid #2a2a2a' : 'none',
                borderRadius: '8px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#222'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i === 0 ? '#422006' : '#1a1a1a',
                  border: `1px solid ${i === 0 ? '#92400e' : '#2a2a2a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', flexShrink: 0
                }}>
                  {i === 0 ? '👑' : `${i + 1}`}
                </span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.user?.username || 'Unknown'}
                    {(m.user?._id === user.id || m.user === user.id) &&
                      <span className="badge badge-purple" style={{ fontSize: '10px' }}>you</span>}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '1px' }}>
                    {memberCheckedToday(m)
                      ? <span style={{ color: '#6ee7b7' }}>✓ checked in today</span>
                      : <span style={{ color: '#fca5a5' }}>✗ not yet</span>}
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: '#2a2a2a', padding: '4px 12px',
                borderRadius: '20px'
              }}>
                <span style={{ color: '#f97316', fontWeight: 700 }}>{m.streak}</span>
                <span style={{ fontSize: '13px' }}>🔥</span>
              </div>
            </div>
          ))}
        </div>

        {/* Squad Chat */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Squad Chat
            <span style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>· real-time</span>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#059669', display: 'inline-block',
              boxShadow: '0 0 6px #059669', animation: 'pulse 2s infinite'
            }} />
          </h3>
          <div style={{
            display: 'flex', flexDirection: 'column',
            height: '240px', overflowY: 'auto',
            background: '#0d0d0d', borderRadius: '10px',
            padding: '12px', marginBottom: '12px',
            border: '1px solid #1f1f1f',
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '70px' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>💬</div>
                <p style={{ color: '#444', fontSize: '13px' }}>No messages yet. Say hi!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.mine ? 'flex-end' : 'flex-start',
                marginBottom: '10px',
              }}>
                {!msg.mine && (
                  <div style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '3px', paddingLeft: '4px', fontWeight: 500 }}>
                    {msg.username}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {msg.mine && (
                    <span
                      onClick={() => deleteMessage(i)}
                      style={{ fontSize: '10px', color: '#333', cursor: 'pointer', padding: '2px 4px', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = '#333'}
                      title="Delete"
                    >✕</span>
                  )}
                  <div style={{
                    padding: '8px 14px',
                    borderRadius: msg.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.mine ? 'linear-gradient(135deg, #5b21b6, #7c3aed)' : '#1f1f1f',
                    color: '#f0f0f0', fontSize: '14px', lineHeight: 1.5,
                    maxWidth: '75%', wordBreak: 'break-word',
                    border: msg.mine ? 'none' : '1px solid #2a2a2a',
                  }}>
                    {msg.text}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#333', marginTop: '3px', paddingLeft: msg.mine ? '0' : '4px' }}>
                  {msg.time}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Message your squad..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{ marginBottom: 0, flex: 1, borderRadius: '20px', padding: '10px 16px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
            />
            <button
              className="btn btn-primary"
              type="submit"
              style={{ borderRadius: '20px', padding: '10px 20px' }}
            >Send</button>
          </form>
        </div>

        {/* Invite */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Invite to Squad</h3>
          <form onSubmit={inviteMember} style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Enter username"
              value={invite}
              onChange={e => setInvite(e.target.value)}
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">Invite</button>
          </form>
        </div>

      </div>
    </>
  );
}