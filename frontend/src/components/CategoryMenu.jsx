import { Link } from 'react-router';
import Icon from './Icon.jsx';
import { useApi } from '../lib/api.js';

// Hãng hiển thị trong menu. Thêm hãng mới: thêm một dòng ở đây (slug khớp bảng brands).
const PHONE_BRANDS = [['apple', 'iPhone'], ['samsung', 'Samsung'], ['xiaomi', 'Xiaomi'], ['oppo', 'OPPO'], ['vivo', 'vivo']];
const LAPTOP_BRANDS = [['apple', 'MacBook'], ['lenovo', 'Lenovo'], ['asus', 'ASUS'], ['acer', 'Acer']];

// Icon cho từng danh mục con phụ kiện (theo slug trong database)
const SUB_ICON = {
  'sac-cap': 'plug', 'op-lung': 'case', kinh: 'shield', pin: 'battery', 'tai-nghe': 'headphones',
  loa: 'headphones', 'chuot-ban-phim': 'grid', 'balo-tui': 'case', 'hub-gia-do': 'plug',
};

export default function CategoryMenu({ onNavigate, className = 'catmenu' }) {
  const { data } = useApi('/api/categories');
  const accessories = data?.find((c) => c.slug === 'phu-kien');

  return (
    <nav className={className} aria-label="Danh mục sản phẩm">
      <div className="grp">Điện thoại</div>
      <div className="chips">
        {PHONE_BRANDS.map(([slug, label]) => (
          <Link key={slug} to={`/danh-muc/dien-thoai?brand=${slug}`} onClick={onNavigate}>{label}</Link>
        ))}
      </div>
      <Link to="/danh-muc/dien-thoai" onClick={onNavigate}><Icon name="phone" size={18} />Tất cả điện thoại<span className="arrow">›</span></Link>

      <div className="sep" />
      <div className="grp">Laptop</div>
      <div className="chips">
        {LAPTOP_BRANDS.map(([slug, label]) => (
          <Link key={slug} to={`/danh-muc/laptop?brand=${slug}`} onClick={onNavigate}>{label}</Link>
        ))}
      </div>
      <Link to="/danh-muc/laptop" onClick={onNavigate}><Icon name="laptop" size={18} />Tất cả laptop<span className="arrow">›</span></Link>

      <div className="sep" />
      <div className="grp">Phụ kiện</div>
      {(accessories?.children ?? []).map((c) => (
        <Link key={c.slug} to={`/danh-muc/${c.slug}`} onClick={onNavigate}>
          <Icon name={SUB_ICON[c.slug] || 'plug'} size={18} />{c.name}<span className="arrow">›</span>
        </Link>
      ))}
    </nav>
  );
}
