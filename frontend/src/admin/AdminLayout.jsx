// Khung trang quản trị: kiểm tra đăng nhập, thanh bên trái, vùng nội dung
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/dh-tech-logo.png';
import Icon from '../components/Icon.jsx';
import { AuthError, adminFetch, clearToken, getToken } from '../lib/admin.js';
import './admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // Mở trang admin thì hỏi backend: token này còn dùng được không?
  useEffect(() => {
    if (!getToken()) return;
    adminFetch('/api/auth/me')
      .then((d) => setAdmin(d.admin))
      .catch(() => { clearToken(); navigate('/admin/dang-nhap', { replace: true, state: { from: location.pathname } }); })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { document.title = 'Quản trị | DH tech'; }, []);

  const logout = useCallback(() => { clearToken(); navigate('/admin/dang-nhap', { replace: true }); }, [navigate]);
  // Trang con gặp lỗi "hết phiên đăng nhập" thì gọi hàm này để quay về trang đăng nhập.
  // useMemo giữ nguyên đối tượng giữa các lần vẽ lại, tránh trang con tải dữ liệu lặp lại.
  const ctx = useMemo(() => ({ onAuthError: (err) => { if (err instanceof AuthError) logout(); } }), [logout]);

  if (!getToken()) return <Navigate to="/admin/dang-nhap" replace state={{ from: location.pathname }} />;
  if (checking) return <div className="admin-loading">Đang kiểm tra đăng nhập…</div>;

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="admin-brand"><img src={logo} alt="DH tech" width="600" height="138" /><span>Quản trị</span></Link>
        <nav>
          <NavLink to="/admin" end><Icon name="phone" size={18} />Sản phẩm</NavLink>
          <NavLink to="/admin/don-hang"><Icon name="cart" size={18} />Đơn hàng</NavLink>
          <a href="/" target="_blank" rel="noreferrer"><Icon name="home" size={18} />Xem website</a>
        </nav>
        <div className="admin-user">
          <span>{admin?.username}</span>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet context={ctx} />
      </main>
    </div>
  );
}
