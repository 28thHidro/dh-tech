// Danh sách đơn hàng
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ORDER_STATUS, adminFetch } from '../lib/admin.js';
import { vnd } from '../lib/format.js';

const fmtTime = (s) => new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Orders() {
  const { onAuthError } = useOutletContext();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);

  const load = () => adminFetch('/api/admin/orders')
    .then((d) => setOrders(d.items))
    .catch((err) => { setError(err.message); onAuthError(err); });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const changeStatus = async (o, status) => {
    setBusy(o.id);
    setError('');
    try {
      await adminFetch(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: { status } });
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
    } catch (err) {
      setError(err.message);
      onAuthError(err);
    } finally {
      setBusy(null);
    }
  };

  const list = (orders ?? []).filter((o) => filter === 'all' || o.status === filter);
  const count = (s) => orders?.filter((o) => o.status === s).length ?? 0;

  return (
    <>
      <div className="admin-head">
        <div><h1>Đơn hàng</h1><p>{orders ? `${count('pending')} đơn chờ xác nhận` : 'Đang tải…'}</p></div>
        <button className="btn btn-line" onClick={load}>Tải lại</button>
      </div>

      <div className="admin-tools">
        <div className="seg" role="group" aria-label="Lọc theo trạng thái">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Tất cả <span className="num">{orders?.length ?? 0}</span></button>
          {Object.entries(ORDER_STATUS).map(([k, s]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{s.label} <span className="num">{count(k)}</span></button>
          ))}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {orders && list.length === 0 && <div className="empty">Chưa có đơn hàng nào ở mục này.</div>}

      <div className="orders">
        {list.map((o) => (
          <article key={o.id} className={`order tone-${ORDER_STATUS[o.status].tone}`}>
            <header>
              <div>
                <b>Đơn #{o.id}</b> <span className={`pill ${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span>
                <small>{fmtTime(o.created_at)}</small>
              </div>
              <b className="num total">{vnd(o.total)}</b>
            </header>
            <div className="order-body">
              <div className="cust">
                <div><b>{o.customer_name}</b>{o.customer_id && <span className="pill ok member" title="Khách đã đăng nhập khi đặt hàng">Thành viên</span>}</div>
                <div className="num phone">{o.phone}</div>
                {o.address && <div>{o.address}</div>}
                {o.note && <div className="note">Ghi chú: {o.note}</div>}
              </div>
              <ul className="lines">
                {o.items?.map((it, i) => (
                  <li key={i}><span>{it.product_name} · {it.variant_name} · {it.color_name}</span><span className="num">{it.quantity} × {vnd(it.unit_price)}</span></li>
                ))}
              </ul>
            </div>
            <footer>
              <label htmlFor={`st-${o.id}`}>Trạng thái</label>
              <select id={`st-${o.id}`} value={o.status} disabled={busy === o.id || o.status === 'cancelled'} onChange={(e) => changeStatus(o, e.target.value)}>
                {Object.entries(ORDER_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
              {o.status !== 'cancelled' && <small className="muted">Chọn "Đã huỷ" sẽ trả hàng về kho.</small>}
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
