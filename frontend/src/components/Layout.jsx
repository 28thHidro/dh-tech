// Khung chung của mọi trang: thanh khuyến mãi, header, footer, ngăn kéo, thông báo
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import logo from '../../assets/dh-tech-logo.png';
import Icon from './Icon.jsx';
import CategoryMenu from './CategoryMenu.jsx';
import CartDrawer from './CartDrawer.jsx';
import MascotDock from './MascotDock.jsx';
import { useCart } from '../lib/cart.jsx';
import { getToken } from '../lib/admin.js';

function Logo() {
  return <img className="logo" src={logo} alt="DH tech" width="600" height="135" />;
}

function SearchBox({ inputRef }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const urlQ = pathname === '/tim-kiem' ? params.get('q') || '' : '';
  const [q, setQ] = useState(urlQ);
  const timer = useRef();

  // Rời trang tìm kiếm thì xoá ô; quay lại thì hiện từ khoá trên URL.
  // Đang gõ (ô đang được chọn) thì không ghi đè, tránh mất chữ khi gõ nhanh.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setQ(urlQ);
  }, [urlQ, inputRef]);

  const go = (value, replace) => {
    const term = value.trim();
    if (term) navigate(`/tim-kiem?q=${encodeURIComponent(term)}`, { replace });
  };

  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); clearTimeout(timer.current); go(q, false); }}>
      <Icon name="search" size={17} />
      <input
        ref={inputRef} id="q" type="search" value={q} aria-label="Tìm sản phẩm" autoComplete="off"
        placeholder="Bạn cần tìm gì? iPhone 18, MacBook Air M5, Legion 5…"
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          // Gõ đến đâu tìm đến đó, nhưng chờ người dùng ngừng gõ 0,4 giây để đỡ gọi API liên tục
          clearTimeout(timer.current);
          if (v.trim().length >= 2) timer.current = setTimeout(() => go(v, pathname === '/tim-kiem'), 400);
        }}
      />
    </form>
  );
}

function MenuDrawer({ onClose }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer left" aria-label="Danh mục">
        <header><Logo /><button className="x" onClick={onClose} aria-label="Đóng">×</button></header>
        <CategoryMenu className="catmenu in-drawer" onNavigate={onClose} />
      </aside>
    </>
  );
}

export default function Layout() {
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, search } = useLocation();
  const searchRef = useRef();
  const isAdmin = Boolean(getToken());

  // Sang trang khác thì cuộn lên đầu (đổi bộ lọc trên cùng trang thì giữ nguyên vị trí)
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // Đổi đường dẫn thì đóng các ngăn kéo
  useEffect(() => {
    setMenuOpen(false);
    cart.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // Nhấn Esc để đóng ngăn kéo
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); cart.setOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cart]);

  return (
    <>
      <div className="promo-bar"><div className="wrap">
        <span>Thu cũ đổi mới, trợ giá đến 3 triệu</span>
        <span>Trả góp 0% qua thẻ tín dụng</span>
        <span>Giao nhanh 2 giờ nội thành TP.HCM</span>
      </div></div>

      <header className="top">
        <div className="wrap">
          <Link className="brand" to="/" aria-label="DH tech, về trang chủ"><Logo /></Link>
          <button className="hbtn" onClick={() => setMenuOpen(true)} aria-label="Mở danh mục sản phẩm">
            <Icon name="menu" size={18} /><span className="lbl">Danh mục</span>
          </button>
          <SearchBox inputRef={searchRef} />
          <div className="hotline">Gọi mua hàng<b className="num">1900 0000</b></div>
          {/* Nút này chỉ hiện trên máy đã đăng nhập admin; khách thường không thấy */}
          {isAdmin && (
            <Link className="hbtn admin-link" to="/admin" aria-label="Về trang quản trị">
              <Icon name="grid" size={18} /><span className="lbl">Quản trị</span>
            </Link>
          )}
          <button className="hbtn cart-btn" onClick={() => cart.setOpen(true)} aria-label="Mở giỏ hàng">
            <Icon name="cart" size={18} /><span className="lbl">Giỏ hàng</span>
            <span className="badge num">{cart.count}</span>
          </button>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="site">
        <div className="wrap">
          <div>
            <Logo />
            <p style={{ marginTop: 12, maxWidth: '34ch' }}>Công nghệ đến gần bạn hơn. Điện thoại, laptop và phụ kiện chính hãng, giá tốt mỗi ngày.</p>
          </div>
          <div>
            <h5>Tổng đài miễn phí</h5>
            <p>Gọi mua hàng (8:00 – 22:00)</p><p className="phone num">1900 0000</p>
            <p style={{ marginTop: 8 }}>Khiếu nại, bảo hành</p><p className="phone num small">1900 0001</p>
          </div>
          <div>
            <h5>Chính sách</h5>
            <ul><li>Bảo hành chính hãng 12 tháng</li><li>Đổi mới 30 ngày nếu lỗi</li><li>Giao hàng tận nơi</li><li>Trả góp 0%</li></ul>
          </div>
          <div>
            <h5>Danh mục</h5>
            <ul>
              <li><Link to="/danh-muc/dien-thoai?brand=apple">iPhone</Link></li>
              <li><Link to="/danh-muc/dien-thoai?brand=samsung">Samsung</Link></li>
              <li><Link to="/danh-muc/laptop">Laptop</Link></li>
              <li><Link to="/danh-muc/phu-kien">Phụ kiện</Link></li>
            </ul>
          </div>
        </div>
        <div className="wrap legal">© 2026 DH tech · Website demo. Giá niêm yết theo giá chính hãng tại Việt Nam lúc mở bán; giá DH tech, khuyến mãi và phụ kiện là dữ liệu mẫu.</div>
      </footer>

      <nav className="bottom-nav" aria-label="Điều hướng nhanh">
        <Link to="/"><Icon name="home" size={21} />Trang chủ</Link>
        <button onClick={() => setMenuOpen(true)}><Icon name="grid" size={21} />Danh mục</button>
        <button onClick={() => { window.scrollTo(0, 0); searchRef.current?.focus(); }}><Icon name="search" size={21} />Tìm kiếm</button>
        <button onClick={() => cart.setOpen(true)}><Icon name="cart" size={21} />Giỏ hàng<span className="badge num">{cart.count}</span></button>
      </nav>

      <MascotDock />
      {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}
      {cart.open && <CartDrawer />}
      {cart.toast && <div className={`toast${cart.open ? ' top' : ''}`} role="status">{cart.toast}</div>}
    </>
  );
}
