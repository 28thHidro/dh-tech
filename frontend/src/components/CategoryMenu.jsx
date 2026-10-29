// Menu danh mục.
//   MegaPanel: bảng lớn thả xuống dưới thanh đầu trang (máy tính), rê chuột vào danh mục bên trái
//              để xem hãng, loại, mức giá và sản phẩm nổi bật.
//   CategoryMenu (mặc định): cùng nội dung, dạng xổ xuống từng mục trong ngăn kéo (điện thoại).
// Hãng và mức giá tự tính từ sản phẩm đang bán, thêm sản phẩm mới là menu tự cập nhật.
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import Icon from './Icon.jsx';
import ProductArt from './ProductArt.jsx';
import { useApi } from '../lib/api.js';
import { brandLabel, vnd } from '../lib/format.js';

const ROOT_ICON = { 'dien-thoai': 'phone', laptop: 'laptop', 'dong-ho': 'watch', 'am-thanh': 'headphones', gaming: 'gamepad', 'phu-kien': 'plug' };
const SUB_ICON = {
  'sac-cap': 'plug', pin: 'battery', 'tai-nghe': 'headphones', loa: 'speaker',
  'ban-phim-co': 'keyboard', 'chuot-gaming': 'sparkle', 'tay-cam': 'gamepad',
};
const PRICES = [
  ['u1', 'Dưới 1 triệu', (x) => x < 1e6],
  ['1-10', 'Từ 1 đến 10 triệu', (x) => x >= 1e6 && x < 1e7],
  ['10-20', 'Từ 10 đến 20 triệu', (x) => x >= 1e7 && x < 2e7],
  ['20-40', 'Từ 20 đến 40 triệu', (x) => x >= 2e7 && x <= 4e7],
  ['o40', 'Trên 40 triệu', (x) => x > 4e7],
];
// Danh mục không có danh mục con thì cột thứ hai gợi ý cách sắp xếp
const SORT_LINKS = [['Nổi bật', ''], ['Giá thấp đến cao', 'sort=price_asc'], ['Giá cao đến thấp', 'sort=price_desc']];

function useMenuData() {
  const { data: cats } = useApi('/api/categories');
  const { data: list } = useApi('/api/products');
  return useMemo(() => {
    const items = list?.items ?? [];
    return (cats ?? []).map((c) => {
      const mine = items.filter((p) => p.category === c.slug || p.parent_category === c.slug);
      return {
        ...c,
        icon: ROOT_ICON[c.slug] || 'grid',
        brands: (c.brands ?? []).map((b) => ({ ...b, label: brandLabel(b.slug, b.name, c.slug) })),
        prices: PRICES.filter(([, , test]) => mine.some((p) => test(p.min_price))),
        featured: [...mine]
          .sort((a, b) => Number(b.is_hot) - Number(a.is_hot) || b.discount_amount - a.discount_amount)
          .slice(0, 3),
        count: mine.length,
      };
    });
  }, [cats, list]);
}

// Nội dung bên phải của một danh mục gốc
function RootDetail({ root, onNavigate }) {
  const base = `/danh-muc/${root.slug}`;
  return (
    <div className="mega-detail" key={root.slug}>
      <div className="mega-head">
        <h3><Icon name={root.icon} size={20} />{root.name}</h3>
        <Link to={base} onClick={onNavigate} className="mega-all">Xem tất cả{root.count > 0 && <span className="num"> {root.count} sản phẩm</span>} ›</Link>
      </div>
      <div className="mega-cols">
        <section>
          <h4>Hãng</h4>
          <div className="mega-brands">
            {root.brands.map((b) => (
              <Link key={b.slug} to={`${base}?brand=${b.slug}`} onClick={onNavigate}>
                <b>{b.label}</b><small className="num">{b.count} sản phẩm</small>
              </Link>
            ))}
            {root.brands.length === 0 && <span className="muted">Đang cập nhật</span>}
          </div>
        </section>
        <section>
          <h4>{root.children.length ? 'Chọn loại' : 'Sắp xếp'}</h4>
          <ul className="mega-list">
            {root.children.length
              ? root.children.map((s) => (
                <li key={s.slug}><Link to={`/danh-muc/${s.slug}`} onClick={onNavigate}><Icon name={SUB_ICON[s.slug] || 'box'} size={17} />{s.name}</Link></li>
              ))
              : SORT_LINKS.map(([label, q]) => (
                <li key={label}><Link to={q ? `${base}?${q}` : base} onClick={onNavigate}>{label}</Link></li>
              ))}
          </ul>
          {root.prices.length > 0 && (
            <>
              <h4>Chọn theo giá</h4>
              <div className="mega-prices">
                {root.prices.map(([k, label]) => <Link key={k} to={`${base}?price=${k}`} onClick={onNavigate}>{label}</Link>)}
              </div>
            </>
          )}
        </section>
        {root.featured.length > 0 && (
          <section className="mega-feat">
            <h4>Sản phẩm nổi bật</h4>
            {root.featured.map((p) => (
              <Link key={p.slug} to={`/san-pham/${p.slug}`} onClick={onNavigate} className="mega-prod">
                <ProductArt product={p} image={p.image} width={120} className="mega-art" />
                <span><b>{p.name}</b><span className="num">{vnd(p.min_price)}</span></span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export function MegaPanel({ onNavigate, onMouseEnter, onMouseLeave }) {
  const roots = useMenuData();
  const [active, setActive] = useState(null);
  const timer = useRef();
  const root = roots.find((r) => r.slug === active) ?? roots[0];
  // Đợi một chút mới đổi danh mục: rê chuột chéo sang bảng bên phải không bị nhảy nhầm mục
  const hover = (slug) => { clearTimeout(timer.current); timer.current = setTimeout(() => setActive(slug), 110); };

  return (
    <div className="mega" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <nav className="mega-box" aria-label="Danh mục sản phẩm">
        <ul className="mega-rail">
          {roots.map((r) => (
            <li key={r.slug}>
              <Link
                to={`/danh-muc/${r.slug}`} onClick={onNavigate}
                className={r === root ? 'on' : ''}
                onMouseEnter={() => hover(r.slug)} onMouseLeave={() => clearTimeout(timer.current)} onFocus={() => setActive(r.slug)}
              >
                <Icon name={r.icon} size={19} />{r.name}<span className="arrow">›</span>
              </Link>
            </li>
          ))}
          {roots.length === 0 && [1, 2, 3, 4, 5, 6].map((k) => <li key={k} className="sk mega-sk" />)}
        </ul>
        {root && <RootDetail root={root} onNavigate={onNavigate} />}
      </nav>
    </div>
  );
}

// Ngăn kéo trên điện thoại: bấm danh mục để xổ ra hãng, loại, mức giá
export default function CategoryMenu({ onNavigate, className = 'catmenu' }) {
  const roots = useMenuData();
  const [open, setOpen] = useState('dien-thoai');

  return (
    <nav className={className} aria-label="Danh mục sản phẩm">
      {roots.map((r) => {
        const isOpen = open === r.slug;
        const base = `/danh-muc/${r.slug}`;
        return (
          <div key={r.slug} className={`acc${isOpen ? ' open' : ''}`}>
            <button className="acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.slug)}>
              <Icon name={r.icon} size={19} />{r.name}<span className="arrow">›</span>
            </button>
            <div className="acc-body">
              <div className="acc-inner">
                {r.brands.length > 0 && (
                  <div className="chips">
                    {r.brands.map((b) => <Link key={b.slug} to={`${base}?brand=${b.slug}`} onClick={onNavigate}>{b.label}</Link>)}
                  </div>
                )}
                {r.children.map((s) => (
                  <Link key={s.slug} to={`/danh-muc/${s.slug}`} onClick={onNavigate}><Icon name={SUB_ICON[s.slug] || 'box'} size={17} />{s.name}</Link>
                ))}
                {r.prices.length > 0 && (
                  <div className="chips prices">
                    {r.prices.map(([k, label]) => <Link key={k} to={`${base}?price=${k}`} onClick={onNavigate}>{label}</Link>)}
                  </div>
                )}
                <Link to={base} onClick={onNavigate} className="acc-all">Xem tất cả {r.name.toLowerCase()} ›</Link>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
