import { useState } from 'react';
import ProductArt from './ProductArt.jsx';
import { useCart } from '../lib/cart.jsx';
import { clearCache, postJSON } from '../lib/api.js';
import { vnd } from '../lib/format.js';

export default function CartDrawer() {
  const cart = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const close = () => cart.setOpen(false);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true);
    setError('');
    try {
      // Chỉ gửi mã SKU và số lượng. Giá do server tự tính từ database.
      const result = await postJSON('/api/orders', {
        customer_name: f.get('name'),
        phone: f.get('phone'),
        address: f.get('address'),
        note: f.get('note'),
        items: cart.items.map((i) => ({ sku_id: i.skuId, quantity: i.qty })),
      });
      cart.clear();
      clearCache(); // tồn kho vừa thay đổi
      setOrder(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer right" aria-label="Giỏ hàng">
        <header><h2>Giỏ hàng</h2><button className="x" onClick={close} aria-label="Đóng giỏ hàng">×</button></header>
        <div className="items">
          {order ? (
            <div className="ok">
              <b>Đặt hàng thành công. Mã đơn #{order.id}</b><br />
              Tổng tiền <span className="num">{vnd(order.total)}</span>. DH tech sẽ gọi lại để xác nhận trong ít phút.
            </div>
          ) : cart.items.length === 0 ? (
            <div className="cart-empty">Giỏ hàng đang trống.<br />Chọn một sản phẩm bạn thích để bắt đầu.</div>
          ) : (
            cart.items.map((i) => (
              <div className="item" key={i.key}>
                <ProductArt product={i} color={i.hex} image={i.image} width={120} className="item-art" />
                <div style={{ minWidth: 0 }}>
                  <h4>{i.name}</h4>
                  <p>{i.variantName} · {i.colorName}</p>
                  <div className="qty">
                    <button onClick={() => cart.setQty(i.key, i.qty - 1)} aria-label="Giảm số lượng">−</button>
                    <span className="num">{i.qty}</span>
                    <button onClick={() => cart.setQty(i.key, Math.min(10, i.qty + 1))} aria-label="Tăng số lượng">+</button>
                  </div>
                </div>
                <div>
                  <div className="ip num">{vnd(i.price * i.qty)}</div>
                  <button className="rm" onClick={() => cart.remove(i.key)}>Xoá</button>
                </div>
              </div>
            ))
          )}
        </div>
        {!order && cart.items.length > 0 && (
          <div className="foot">
            <div className="total"><span>Tạm tính</span><b className="num">{vnd(cart.total)}</b></div>
            <form className="form" onSubmit={submit}>
              <input id="oName" name="name" required minLength={2} maxLength={100} placeholder="Họ và tên" autoComplete="name" />
              <input id="oPhone" name="phone" required placeholder="Số điện thoại" inputMode="tel" autoComplete="tel" pattern="0[0-9]{9}" title="Số điện thoại gồm 10 chữ số, bắt đầu bằng 0" />
              <input id="oAddress" name="address" maxLength={300} placeholder="Địa chỉ nhận hàng (không bắt buộc)" autoComplete="street-address" />
              <input id="oNote" name="note" maxLength={300} placeholder="Ghi chú (không bắt buộc)" />
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="btn btn-primary" disabled={sending}>{sending ? 'Đang gửi đơn…' : 'Đặt hàng'}</button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
