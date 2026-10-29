// Linh vật Cam ở góc phải màn hình: bấm vào để mở menu hỗ trợ nhanh.
// Khách bấm "Ẩn" thì Cam biến mất tới khi đóng trình duyệt (lưu trong sessionStorage).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Mascot from './Mascot.jsx';

const KEY = 'dh-cam-hidden';
const readHidden = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function MascotDock() {
  const [hidden, setHidden] = useState(readHidden);
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(false);

  // Lời chào hiện sau 2 giây rồi tự tắt sau 8 giây
  useEffect(() => {
    if (hidden) return;
    const a = setTimeout(() => setBubble(true), 2000);
    const b = setTimeout(() => setBubble(false), 10000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [hidden]);

  if (hidden) return null;

  const hide = () => {
    try { sessionStorage.setItem(KEY, '1'); } catch { /* trình duyệt chặn lưu trữ thì thôi */ }
    setHidden(true);
  };

  return (
    <div className={`cam-dock${open ? ' open' : ''}`}>
      {open && (
        <div className="cam-panel" role="dialog" aria-label="Cam hỗ trợ">
          <header>
            <b>Cam có thể giúp gì cho bạn?</b>
            <button className="x" onClick={() => setOpen(false)} aria-label="Đóng">×</button>
          </header>
          <a href="tel:19000000"><span>Gọi mua hàng</span><b className="num">1900 0000</b></a>
          <a href="tel:19000001"><span>Bảo hành, khiếu nại</span><b className="num">1900 0001</b></a>
          <Link to="/danh-muc/dien-thoai?brand=apple" onClick={() => setOpen(false)}><span>iPhone mới nhất</span><b>›</b></Link>
          <Link to="/danh-muc/laptop" onClick={() => setOpen(false)}><span>Laptop cho sinh viên</span><b>›</b></Link>
          <button className="cam-hide" onClick={hide}>Ẩn Cam</button>
        </div>
      )}
      {bubble && !open && <div className="cam-bubble" role="status">Cần tư vấn? Bấm vào Cam nhé!</div>}
      <button className="cam-btn" onClick={() => { setOpen((o) => !o); setBubble(false); }} aria-expanded={open} aria-label="Mở hỗ trợ nhanh">
        <Mascot size={78} />
      </button>
    </div>
  );
}
