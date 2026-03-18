import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, body);
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.username}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7c3aed' }}>StreakSquad</h1>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Build habits together</p>
        </div>

        <form onSubmit={handle}>
          {!isLogin && (
            <input
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#888', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#7c3aed', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}