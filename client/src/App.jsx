import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import Profile from './pages/Profile';
const Protected = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/squad/:id" element={<Protected><Squad /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}