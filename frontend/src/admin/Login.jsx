import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/dh-tech-logo.png';
import { API_BASE } from '../lib/api.js';
import { getToken, setToken } from '../lib/admin.js';
import './admin.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (getToken()) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: f.get('username'), password: f.get('password') }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      setToken(data.token);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Không kết nối được máy chủ. Thử lại sau ít giây.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-head"><img src={logo} alt="DH tech" width="600" height="138" /></div>
        <h1>Đăng nhập quản trị</h1>
        <label htmlFor="username">Tên đăng nhập</label>
        <input id="username" name="username" required autoComplete="username" autoFocus />
        <label htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <a className="back" href="/">‹ Về trang bán hàng</a>
      </form>
    </div>
  );
}
