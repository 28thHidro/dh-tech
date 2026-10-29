import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ProductArt from '../components/ProductArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBox } from '../components/States.jsx';
import { useApi } from '../lib/api.js';
import { useCart } from '../lib/cart.jsx';
import { percentOff, vnd } from '../lib/format.js';

export default function ProductPage() {
  const { slug } = useParams();
  const { data: p, error, loading, reload } = useApi(`/api/products/${slug}`);

  if (error) {
    return (
      <div className="wrap page-head">
        <ErrorBox error={error} onRetry={error.message.includes('Không tìm thấy') ? null : reload} />
        <p><Link className="more" to="/">‹ Về trang chủ</Link></p>
      </div>
    );
  }
  if (loading || !p) return <div className="wrap"><div className="d-grid"><div className="panel sk sk-panel" /><div className="panel sk sk-panel" /></div></div>;
  // key={p.slug}: sang sản phẩm khác thì làm mới toàn bộ lựa chọn
  return <ProductDetail key={p.slug} p={p} />;
}

function ProductDetail({ p }) {
  const cart = useCart();
  const navigate = useNavigate();

  // Tra tồn kho nhanh: "variantId-colorId" -> số máy
  const stockOf = useMemo(() => {
    const map = new Map(p.skus.map((s) => [`${s.variant_id}-${s.color_id}`, s.stock]));
    return (vId, cId) => map.get(`${vId}-${cId}`) ?? 0;
  }, [p]);

  // Mặc định chọn phiên bản và màu đầu tiên còn hàng
  const first = p.variants.find((v) => p.colors.some((c) => stockOf(v.id, c.id) > 0)) ?? p.variants[0];
  const [variantId, setVariantId] = useState(first.id);
  const [colorId, setColorId] = useState((p.colors.find((c) => stockOf(first.id, c.id) > 0) ?? p.colors[0]).id);

  const variant = p.variants.find((v) => v.id === variantId);
  const color = p.colors.find((c) => c.id === colorId);
  const stock = stockOf(variantId, colorId);
  const image = p.images.find((i) => i.color_id === colorId)?.url ?? p.images.find((i) => !i.color_id)?.url;

  useEffect(() => { document.title = `${p.name} | DH tech`; return () => { document.title = 'DH tech - Công nghệ đến gần bạn hơn'; }; }, [p.name]);

  const { data: related } = useApi(`/api/products?category=${p.category}`);
  const others = (related?.items ?? []).filter((x) => x.slug !== p.slug).slice(0, 5);

  const addToCart = () => cart.add({
    slug: p.slug, name: p.name, brand_slug: p.brand_slug, category: p.category,
    variantId, variantName: variant.name, colorId, colorName: color.name, hex: color.hex,
    price: variant.price, listPrice: variant.list_price,
  });

  const stockNote = stock === 0 ? { cls: 'out', text: 'Tạm hết hàng phiên bản này. Chọn màu hoặc dung lượng khác.' }
    : stock <= 3 ? { cls: 'low', text: `Chỉ còn ${stock} máy, đặt sớm kẻo hết` }
    : { cls: 'in', text: 'Còn hàng, giao nhanh 2 giờ nội thành TP.HCM' };

  const catLink = p.brand_slug ? `/danh-muc/${p.category}?brand=${p.brand_slug}` : `/danh-muc/${p.category}`;

  return (
    <div className="wrap">
      <div className="page-head compact">
        <div className="crumbs">
          <Link to="/">Trang chủ</Link> › <Link to={catLink}>{p.brand === 'Apple' ? 'iPhone' : p.brand || p.category_name}</Link> › {p.name}
        </div>
      </div>

      <div className="d-grid">
        <div className="panel gallery">
          <ProductArt product={p} color={color.hex} image={image} className="d-art" />
          <div className="thumbs">
            {p.colors.map((c) => (
              <button key={c.id} aria-label={c.name} aria-pressed={c.id === colorId} onClick={() => setColorId(c.id)}>
                <ProductArt product={p} color={c.hex} className="thumb-art" />
              </button>
            ))}
          </div>
        </div>

        <div className="panel d-info">
          <h1>{p.name}</h1>
          <p className="line">{p.short_desc}</p>

          <div className="opt-label">Chọn phiên bản</div>
          <div className="opts">
            {p.variants.map((v) => {
              const anyStock = p.colors.some((c) => stockOf(v.id, c.id) > 0);
              return (
                <button key={v.id} className={`opt${anyStock ? '' : ' none'}`} aria-pressed={v.id === variantId} onClick={() => setVariantId(v.id)}>
                  {v.name}<small className="num">{anyStock ? vnd(v.price) : 'Hết hàng'}</small>
                </button>
              );
            })}
          </div>

          <div className="opt-label">Chọn màu</div>
          <div className="opts">
            {p.colors.map((c) => {
              const n = stockOf(variantId, c.id);
              return (
                <button key={c.id} className={`opt${n === 0 ? ' none' : ''}`} aria-pressed={c.id === colorId} onClick={() => setColorId(c.id)}>
                  <span><i className="sw" style={{ background: c.hex }} />{c.name}</span>
                  <small>{n === 0 ? 'Hết hàng' : n <= 3 ? `Còn ${n} máy` : 'Còn hàng'}</small>
                </button>
              );
            })}
          </div>

          <div className="pbox">
            <div className="row"><b className="num">{vnd(variant.price)}</b>{p.discount_amount > 0 && <s className="num">{vnd(variant.list_price)}</s>}</div>
            {p.discount_amount > 0 && <div className="save num">Tiết kiệm {vnd(p.discount_amount)} ({percentOff(variant.list_price, p.discount_amount)}%)</div>}
            <div className={`stock ${stockNote.cls}`}>{stockNote.text}</div>
          </div>

          <div className="offers">
            <h3>Khuyến mãi</h3>
            <ol>
              {p.gift_text && <li>{p.gift_text}</li>}
              <li>Giảm thêm 5% khi mua kèm phụ kiện</li>
              {p.category === 'dien-thoai' ? <li>Trả góp 0% qua thẻ tín dụng, kỳ hạn 6 – 12 tháng</li> : <li>Miễn phí giao hàng cho đơn từ 300.000đ</li>}
            </ol>
          </div>

          <div className="buy-row">
            <button className="btn btn-primary" disabled={stock === 0} onClick={() => { addToCart(); cart.setOpen(true); }}>
              {stock === 0 ? 'TẠM HẾT HÀNG' : 'MUA NGAY'}
              <small>{stock === 0 ? 'Chọn màu hoặc dung lượng khác' : 'Giao nhanh 2 giờ hoặc nhận tại cửa hàng'}</small>
            </button>
            <button className="btn btn-line" disabled={stock === 0} onClick={addToCart} aria-label="Thêm vào giỏ hàng"><Icon name="cartPlus" size={22} /></button>
          </div>
          {p.category === 'dien-thoai' && (
            <div className="inst-row">
              <button className="btn" onClick={() => cart.notify('Gọi 1900 0000 để được tư vấn trả góp')}>
                <span className="num">Trả góp 0% · từ {vnd(Math.round(variant.price / 12 / 1000) * 1000)}/tháng</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="d-grid">
        <div className="panel">
          <h2>Thông số kỹ thuật</h2>
          <table className="specs"><tbody>
            {p.specs.map((s) => <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>)}
          </tbody></table>
        </div>
        <div className="panel">
          <h2>Cam kết của DH tech</h2>
          <ol className="promise">
            <li>Máy mới 100%, nguyên hộp, hàng chính hãng.</li>
            <li>Bảo hành 12 tháng tại trung tâm bảo hành chính hãng.</li>
            <li>1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</li>
            <li>Giá đã bao gồm VAT.</li>
          </ol>
        </div>
      </div>

      {others.length > 0 && (
        <section className="sec">
          <div className="sec-head"><h2>Sản phẩm tương tự</h2><button className="more linkish" onClick={() => navigate(catLink)}>Xem thêm ›</button></div>
          <div className="grid">{others.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
        </section>
      )}
    </div>
  );
}
