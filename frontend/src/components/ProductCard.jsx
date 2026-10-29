import { Link } from 'react-router';
import ProductArt from './ProductArt.jsx';
import { percentOff, shortVariant, vnd } from '../lib/format.js';

// Thẻ sản phẩm trong lưới. Dữ liệu từ GET /api/products
export default function ProductCard({ p }) {
  const soldOut = p.total_stock === 0;
  // Nhãn phiên bản gọn: điện thoại chỉ hiện dung lượng (bỏ RAM); laptop giữ nguyên cấu hình. Bỏ nhãn trùng.
  const chips = [...new Set(p.variants.map((v) => (p.category === 'laptop' ? v : shortVariant(v))))];
  return (
    <Link className={`card${soldOut ? ' sold-out' : ''}`} to={`/san-pham/${p.slug}`}>
      <div className="flags">
        {p.discount_amount > 0 && <span className="disc">Giảm {percentOff(p.min_list_price, p.discount_amount)}%</span>}
        {(p.category === 'dien-thoai' || p.category === 'laptop') && <span className="inst">Trả góp 0%</span>}
      </div>
      <ProductArt product={p} image={p.image} width={400} />
      <h3>{p.name}</h3>
      <div className="price num">
        <b>{vnd(p.min_price)}</b>
        {p.discount_amount > 0 && <s>{vnd(p.min_list_price)}</s>}
      </div>
      {chips.length > 1 && <div className="vchips">{chips.map((v) => <span key={v}>{v}</span>)}</div>}
      {p.colors?.length > 1 && (
        <div className="dots" aria-label={`${p.colors.length} màu`}>
          {p.colors.map((c) => <i key={c.name} style={{ background: c.hex }} title={c.name} />)}
        </div>
      )}
      {soldOut ? <div className="gift out">Tạm hết hàng</div> : p.gift_text && <div className="gift">{p.gift_text}</div>}
    </Link>
  );
}
