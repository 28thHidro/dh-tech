// Đăng nhập quản trị: dùng chung khung "kéo dây bật đèn" với trang đăng nhập khách hàng
import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import LampAuth, { AuthField } from '../components/LampAuth.jsx';
import Icon from '../components/Icon.jsx';
import { API_BASE } from '../lib/api.js';
import { getToken, setToken } from '../lib/admin.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef();

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
    <LampAuth
      scope="Quản trị"
      headline={['Bật đèn.', 'Vào việc.']}
      text="Khu vực dành cho nhân viên DH tech: quản lý sản phẩm, ảnh, tồn kho và đơn hàng."
      title="Đăng nhập quản trị"
      subtitle="Dùng tài khoản do quản lý cấp."
      onLit={() => setTimeout(() => formRef.current?.username?.focus(), 350)}
    >
      <form ref={formRef} onSubmit={submit}>
        <AuthField icon="user" label="Tên đăng nhập" id="username" required autoComplete="username" placeholder="admin" />
        <AuthField icon="lock" label="Mật khẩu" id="password" type="password" required autoComplete="current-password" placeholder="••••••••••" />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? 'Đang đăng nhập…' : <>Vào trang quản trị <Icon name="arrow" size={18} /></>}</button>
      </form>
    </LampAuth>
  );
}
