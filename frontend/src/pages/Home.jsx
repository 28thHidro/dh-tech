import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';
import CategoryMenu from '../components/CategoryMenu.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductArt from '../components/ProductArt.jsx';
import Commitments from '../components/Commitments.jsx';
import { ErrorBox, SkeletonGrid } from '../components/States.jsx';
import { useApi } from '../lib/api.js';
import { brandLabel, vnd } from '../lib/format.js';

// Nội dung banner do đội marketing soạn. Giá lấy từ API theo slug.
const SLIDES = [
  { slug: 'iphone-duo', eyebrow: 'Mới · Có hàng từ 23/10', title: ['iPhone Duo', 'mở ra là màn hình lớn'], text: 'Chiếc iPhone gập đầu tiên. Đặt hàng hôm nay, giao nhanh trong 2 giờ.' },
  { slug: 'macbook-air-13-m5', eyebrow: 'Mùa tựu trường', title: ['MacBook Air M5', 'mỏng nhẹ, pin cả ngày'], text: 'Giảm thêm cho học sinh, sinh viên. Trả góp 0% qua thẻ tín dụng.' },
  { slug: 'galaxy-z-fold8-ultra', eyebrow: 'Galaxy Z Series', title: ['Galaxy Z Fold8 Ultra', 'màn hình gập cỡ lớn'], text: 'Giảm ngay 3 triệu, tặng bao da kèm bút.' },
  { slug: 'iphone-18-pro-max', eyebrow: 'iPhone 18 Series', title: ['iPhone 18 Pro Max', 'chip A20 Pro'], text: 'Camera 48MP Pro Fusion và pin xem video đến 43 giờ. Thu cũ trợ giá đến 3 triệu.' },
];

const QUICK = [
  ['apple', 'iPhone', '/danh-muc/dien-thoai?brand=apple'],
  ['samsung', 'Samsung', '/danh-muc/dien-thoai?brand=samsung'],
  ['phone', 'Xiaomi', '/danh-muc/dien-thoai?brand=xiaomi'],
  ['laptop', 'MacBook', '/danh-muc/laptop?brand=apple'],
  ['laptop', 'Laptop', '/danh-muc/laptop'],
  ['headphones', 'Tai nghe, loa', '/danh-muc/tai-nghe'],
  ['plug', 'Sạc, cáp', '/danh-muc/sac-cap'],
  ['battery', 'Pin dự phòng', '/danh-muc/pin'],
];

// Một khối sản phẩm theo danh mục, có các nút lọc theo hãng (lấy từ chính dữ liệu)
function CategorySection({ title, items, category, loading }) {
  const [brand, setBrand] = useState('');
  const list = items.filter((p) => !brand || p.brand_slug === brand).slice(0, 10);
  const brands = [...new Map(items.filter((p) => p.brand_slug).map((p) => [p.brand_slug, brandLabel(p.brand_slug, p.brand, category)])).entries()];
  const link = brand ? `/danh-muc/${category}?brand=${brand}` : `/danh-muc/${category}`;
  return (
    <section className="sec">
      <div className="sec-head">
        <h2>{title}</h2>
        <div className="tabs" role="group" aria-label="Lọc theo hãng">
          {brands.length > 1 && <button className="tab" aria-pressed={!brand} onClick={() => setBrand('')}>Tất cả</button>}
          {brands.length > 1 && brands.map(([k, l]) => <button key={k} className="tab" aria-pressed={brand === k} onClick={() => setBrand(k)}>{l}</button>)}
          <Link className="more" to={link}>Xem tất cả ›</Link>
        </div>
      </div>
      {loading ? <SkeletonGrid /> : <div className="grid">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
    </section>
  );
}

// Đếm ngược đến 23:59:59 Chủ nhật tuần này
function useCountdown() {
  const calc = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    end.setHours(23, 59, 59, 0);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600); s %= 3600;
    return [h, Math.floor(s / 60), s % 60].map((x) => String(x).padStart(2, '0'));
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, []);
  return t;
}

function Banner({ products }) {
  const [cur, setCur] = useState(0);
  const slides = SLIDES.map((s) => ({ ...s, p: products?.find((p) => p.slug === s.slug) })).filter((s) => s.p);

  useEffect(() => {
    if (slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length, cur]);

  if (!slides.length) return <section className="banner banner-empty" aria-busy="true" />;

  return (
    <section className="banner" aria-label="Sản phẩm nổi bật">
      {slides.map((s, i) => (
        <div key={s.slug} className={`slide${i === cur ? ' on' : ''}`} aria-hidden={i !== cur}>
          <div className="slide-copy">
            <div className="eb">{s.eyebrow}</div>
            <h2>{s.title[0]}<br />{s.title[1]}</h2>
            <p>{s.text}</p>
            <div className="from">Giá chỉ từ<b className="num">{vnd(s.p.min_price)}</b></div>
            <Link className="btn btn-primary" to={`/san-pham/${s.slug}`} tabIndex={i === cur ? 0 : -1}>Mua ngay</Link>
          </div>
          <ProductArt product={s.p} image={s.p.image} width={700} className="slide-art" />
        </div>
      ))}
      <div className="dots-nav">
        {slides.map((s, i) => (
          <button key={s.slug} aria-label={`Banner ${i + 1}`} aria-current={i === cur} onClick={() => setCur(i)} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { data, error, loading, reload } = useApi('/api/products');
  const [h, m, s] = useCountdown();

  const items = data?.items ?? [];
  const hot = items.filter((p) => p.is_hot);
  const phones = items.filter((p) => p.category === 'dien-thoai');
  const laptops = items.filter((p) => p.category === 'laptop');
  const accessories = items.filter((p) => p.parent_category === 'phu-kien');
  const waiting = loading && !data;

  return (
    <div className="wrap">
      <div className="home-top">
        <CategoryMenu />
        <Banner products={items} />
        <div className="side-promos">
          <Link className="sp dark" to="/danh-muc/dien-thoai?brand=apple"><span className="k">Thu cũ đổi mới</span><h3>Lên đời iPhone 18 Pro</h3><p>Trợ giá đến 3 triệu khi đổi máy cũ.</p></Link>
          <Link className="sp" to="/danh-muc/laptop"><span className="k">Laptop</span><h3>Laptop gaming giảm đến 6 triệu</h3><p>Lenovo Legion, Acer Nitro, ASUS TUF.</p></Link>
          <Link className="sp" to="/danh-muc/phu-kien"><span className="k">Phụ kiện</span><h3>Mua kèm giảm đến 30%</h3><p>Sạc GaN, pin dự phòng, tai nghe, balo laptop.</p></Link>
        </div>
      </div>

      <div className="quick">
        {QUICK.map(([icon, label, to]) => (
          <Link key={label} to={to}><span className="ic"><Icon name={icon} size={22} /></span>{label}</Link>
        ))}
      </div>

      {error && <ErrorBox error={error} onRetry={reload} />}

      <section className="sec hot">
        <div className="sec-head">
          <h2><span className="bolt"><Icon name="bolt" size={18} /></span>Hot sale cuối tuần</h2>
          <div className="timer" aria-label="Thời gian còn lại">Kết thúc sau <b className="num">{h}</b>:<b className="num">{m}</b>:<b className="num">{s}</b></div>
        </div>
        {waiting ? <SkeletonGrid count={4} /> : (
          <div className="rail">{hot.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        )}
      </section>

      <CategorySection title="Điện thoại nổi bật" items={phones} category="dien-thoai" loading={waiting} />
      <CategorySection title="Laptop" items={laptops} category="laptop" loading={waiting} />

      <section className="sec">
        <div className="sec-head"><h2>Phụ kiện công nghệ</h2><Link className="more" to="/danh-muc/phu-kien">Xem tất cả ›</Link></div>
        {waiting ? <SkeletonGrid /> : <div className="grid">{accessories.slice(0, 10).map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
      </section>

      <section className="sec"><Commitments /></section>
    </div>
  );
}
