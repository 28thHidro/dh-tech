// Danh sách sản phẩm trong trang quản trị
import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import ProductArt from '../components/ProductArt.jsx';
import { adminFetch } from '../lib/admin.js';
import { vnd } from '../lib/format.js';

export default function Products() {
  const { onAuthError } = useOutletContext();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [show, setShow] = useState('all');

  useEffect(() => {
    adminFetch('/api/admin/products')
      .then((d) => setItems(d.items))
      .catch((err) => { setError(err.message); onAuthError(err); });
  }, [onAuthError]);

  const term = q.trim().toLowerCase();
  const list = (items ?? []).filter((p) =>
    (!term || p.name.toLowerCase().includes(term) || p.slug.includes(term)) &&
    (show === 'all' || (show === 'hidden' && !p.is_active) || (show === 'low' && (p.out_of_stock_skus > 0 || p.total_stock < 5)))
  );
  const counts = {
    all: items?.length ?? 0,
    hidden: items?.filter((p) => !p.is_active).length ?? 0,
    low: items?.filter((p) => p.out_of_stock_skus > 0 || p.total_stock < 5).length ?? 0,
  };

  return (
    <>
      <div className="admin-head">
        <div><h1>Sản phẩm</h1><p>{items ? `${items.length} sản phẩm` : 'Đang tải…'}</p></div>
        <Link className="btn btn-primary" to="/admin/san-pham/moi">+ Thêm sản phẩm</Link>
      </div>

      <div className="admin-tools">
        <input type="search" id="admin-q" placeholder="Tìm theo tên hoặc slug…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm" />
        <div className="seg" role="group" aria-label="Lọc">
          {[['all', 'Tất cả'], ['low', 'Hết / sắp hết'], ['hidden', 'Đang ẩn']].map(([k, l]) => (
            <button key={k} aria-pressed={show === k} onClick={() => setShow(k)}>{l} <span className="num">{counts[k]}</span></button>
          ))}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th className="r">Giá niêm yết từ</th><th className="r">Giảm</th><th className="r">Tồn kho</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {!items && !error && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={6}><div className="sk sk-line" /></td></tr>)}
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="prod-cell" to={`/admin/san-pham/${p.id}`}>
                    <ProductArt product={p} image={p.image} width={96} className="mini-art" />
                    <span><b>{p.name}</b><small>{p.slug}</small></span>
                  </Link>
                </td>
                <td>{p.category_name}{p.brand ? <small className="sub">{p.brand}</small> : null}</td>
                <td className="r num">{vnd(p.min_list_price)}</td>
                <td className="r num">{p.discount_amount ? vnd(p.discount_amount) : '0đ'}</td>
                <td className="r num">
                  {p.total_stock}
                  {p.out_of_stock_skus > 0 && <small className="sub bad">{p.out_of_stock_skus} loại hết</small>}
                </td>
                <td>
                  <div className="pills">
                    <span className={`pill ${p.is_active ? 'ok' : 'muted'}`}>{p.is_active ? 'Đang bán' : 'Đang ẩn'}</span>
                    {p.is_hot && <span className="pill info">Hot</span>}
                  </div>
                </td>
              </tr>
            ))}
            {items && list.length === 0 && <tr><td colSpan={6} className="empty-row">Không có sản phẩm phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
