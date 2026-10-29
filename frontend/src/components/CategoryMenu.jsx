import { Link } from 'react-router';
import Icon from './Icon.jsx';
import { useApi } from '../lib/api.js';

// Icon cho từng danh mục con (theo slug trong database)
const SUB_ICON = { 'sac-cap': 'plug', 'op-lung': 'case', kinh: 'shield', pin: 'battery', 'tai-nghe': 'headphones' };

export default function CategoryMenu({ onNavigate, className = 'catmenu' }) {
  const { data } = useApi('/api/categories');
  const accessories = data?.find((c) => c.slug === 'phu-kien');

  return (
    <nav className={className} aria-label="Danh mục sản phẩm">
      <div className="grp">Điện thoại</div>
      <Link to="/danh-muc/dien-thoai?brand=apple" onClick={onNavigate}><Icon name="apple" size={18} />iPhone<span className="arrow">›</span></Link>
      <Link to="/danh-muc/dien-thoai?brand=samsung" onClick={onNavigate}><Icon name="samsung" size={18} />Samsung<span className="arrow">›</span></Link>
      <Link to="/danh-muc/dien-thoai" onClick={onNavigate}><Icon name="phone" size={18} />Tất cả điện thoại<span className="arrow">›</span></Link>
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
