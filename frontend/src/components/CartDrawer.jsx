import { useState } from 'react';
import ProductArt from './ProductArt.jsx';
import { useCart } from '../lib/cart.jsx';
import { vnd } from '../lib/format.js';

export default function CartDrawer() {
  const cart = useCart();
  const [done, setDone] = useState(false);
  const close = () => cart.setOpen(false);

  const submit = (e) => {
    e.preventDefault();
    // Bước sau: gửi đơn lên POST /api/orders. Hiện tại chỉ ghi nhận trên trình duyệt.
    cart.clear();
    setDone(true);
  };

  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer right" aria-label="Giỏ hàng">
        <header><h2>Giỏ hàng</h2><button className="x" onClick={close} aria-label="Đóng giỏ hàng">×</button></header>
        <div className="items">
          {done ? (
            <div className="ok">Đã ghi nhận đơn hàng. DH tech sẽ gọi lại để xác nhận trong ít phút. (Bản demo, chưa gửi đơn thật.)</div>
          ) : cart.items.length === 0 ? (
            <div className="cart-empty">Giỏ hàng đang trống.<br />Chọn một sản phẩm bạn thích để bắt đầu.</div>
          ) : (
            cart.items.map((i) => (
              <div className="item" key={i.key}>
                <ProductArt product={i} color={i.hex} className="item-art" />
                <div style={{ minWidth: 0 }}>
                  <h4>{i.name}</h4>
                  <p>{i.variantName} · {i.colorName}</p>
                  <div className="qty">
                    <button onClick={() => cart.setQty(i.key, i.qty - 1)} aria-label="Giảm số lượng">−</button>
                    <span className="num">{i.qty}</span>
                    <button onClick={() => cart.setQty(i.key, i.qty + 1)} aria-label="Tăng số lượng">+</button>
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
        {!done && cart.items.length > 0 && (
          <div className="foot">
            <div className="total"><span>Tạm tính</span><b className="num">{vnd(cart.total)}</b></div>
            <form className="form" onSubmit={submit}>
              <input id="oName" required placeholder="Họ và tên" autoComplete="name" />
              <input id="oPhone" required placeholder="Số điện thoại" inputMode="tel" pattern="0[0-9]{9}" title="Số điện thoại gồm 10 chữ số, bắt đầu bằng 0" />
              <button className="btn btn-primary">Đặt hàng</button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
