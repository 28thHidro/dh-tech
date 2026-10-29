// Trang tài khoản: thông tin cá nhân và đơn hàng của tôi
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import Icon from '../components/Icon.jsx';
import Mascot from '../components/Mascot.jsx';
import { ErrorBox } from '../components/States.jsx';
import { accountFetch, initial, useAccount } from '../lib/account.jsx';
import { vnd } from '../lib/format.js';

const STATUS = {
  pending: ['Chờ xác nhận', 'warn'],
  confirmed: ['Đã xác nhận', 'info'],
  shipping: ['Đang giao', 'info'],
  completed: ['Hoàn tất', 'ok'],
  cancelled: ['Đã huỷ', 'bad'],
};
const STEPS = ['pending', 'confirmed', 'shipping', 'completed'];
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function OrderCard({ o }) {
  const [label, tone] = STATUS[o.status] ?? [o.status, 'info'];
  const step = STEPS.indexOf(o.status);
  return (
    <article className="my-order">
      <header>
        <div><b>Đơn #{o.id}</b><span className="muted">{fmtDate(o.created_at)}</span></div>
        <span className={`chip ${tone}`}>{label}</span>
      </header>
      {o.status !== 'cancelled' && (
        <ol className="track" aria-label="Tiến trình đơn hàng">
          {STEPS.map((s, i) => <li key={s} className={i <= step ? 'done' : ''}>{STATUS[s][0]}</li>)}
        </ol>
      )}
      <ul className="my-items">
        {o.items.map((it, i) => (
          <li key={i}>
            <span>{it.name}<small>{it.variant} · {it.color} · x{it.quantity}</small></span>
            <b className="num">{vnd(it.price * it.quantity)}</b>
          </li>
        ))}
      </ul>
      <footer><span>Tổng tiền</span><b className="num">{vnd(o.total)}</b></footer>
    </article>
  );
}

export default function AccountPage() {
  const { user, ready, signOut } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => { document.title = 'Tài khoản của tôi | DH tech'; }, []);

  useEffect(() => {
    if (!user) return;
    setError(null);
    accountFetch('/api/account/orders')
      .then((d) => setOrders(d.items))
      .catch((err) => { if (err.status === 401) signOut(); else setError(err); });
  }, [user, nonce, signOut]);

  if (!ready) return <div className="wrap page-head"><div className="panel sk sk-panel" /></div>;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;

  const logout = () => { signOut(); navigate('/', { replace: true }); };

  return (
    <div className="wrap account">
      <section className="acc-card">
        <div className="acc-avatar" aria-hidden="true">{initial(user.full_name)}</div>
        <div className="acc-info">
          <span className="k">Thành viên DH tech</span>
          <h1>{user.full_name}</h1>
          <p className="num">{user.phone}{user.email ? ` · ${user.email}` : ''}</p>
        </div>
        <button className="acc-logout" onClick={logout}><Icon name="logout" size={18} /> Đăng xuất</button>
      </section>

      <section className="sec">
        <div className="sec-head"><h2>Đơn hàng của tôi</h2></div>
        {error ? <ErrorBox error={error} onRetry={() => setNonce((n) => n + 1)} />
          : orders === null ? <div className="panel sk sk-panel" />
          : orders.length === 0 ? (
            <div className="acc-empty">
              <Mascot size={110} mood="phone" />
              <div>
                <h3>Bạn chưa có đơn hàng nào</h3>
                <p>Đơn bạn đặt khi đã đăng nhập sẽ hiện ở đây, kèm trạng thái giao hàng.</p>
                <Link className="btn btn-primary" to="/">Mua sắm ngay</Link>
              </div>
            </div>
          ) : (
            <div className="my-orders">{orders.map((o) => <OrderCard key={o.id} o={o} />)}</div>
          )}
      </section>
    </div>
  );
}
