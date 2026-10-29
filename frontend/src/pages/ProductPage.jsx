import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ProductArt from '../components/ProductArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBox } from '../components/States.jsx';
import { cdn, useApi } from '../lib/api.js';
import { useCart } from '../lib/cart.jsx';
import { brandLabel, percentOff, vnd } from '../lib/format.js';

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
  const sku = p.skus.find((s) => s.variant_id === variantId && s.color_id === colorId);

  // Bộ ảnh của một màu: các góc chụp gắn với màu đó, rồi tới ảnh chung.
  // Màu chưa có ảnh riêng thì chỉ dùng ảnh chung.
  const photosOf = (cId) => {
    const own = p.images.filter((i) => i.color_id === cId).map((i) => i.url);
    const shared = p.images.filter((i) => !i.color_id).map((i) => i.url);
    return [...own, ...shared];
  };
  const photos = photosOf(colorId);
  const image = photos[0];

  useEffect(() => { document.title = `${p.name} | DH tech`; return () => { document.title = 'DH tech - Công nghệ đến gần bạn hơn'; }; }, [p.name]);

  const { data: related } = useApi(`/api/products?category=${p.category}`);
  const others = (related?.items ?? []).filter((x) => x.slug !== p.slug).slice(0, 5);

  const addToCart = () => cart.add({
    skuId: sku?.id, image,
    slug: p.slug, name: p.name, brand_slug: p.brand_slug, category: p.category,
    variantId, variantName: variant.name, colorId, colorName: color.name, hex: color.hex,
    price: variant.price, listPrice: variant.list_price,
  });

  const catLink = p.brand_slug ? `/danh-muc/${p.category}?brand=${p.brand_slug}` : `/danh-muc/${p.category}`;
  const sections = p.sections ?? [];

  return (
    <div className="wrap">
      <div className="page-head compact">
        <div className="crumbs">
          <Link to="/">Trang chủ</Link> › <Link to={catLink}>{p.brand_slug ? brandLabel(p.brand_slug, p.brand, p.category) : p.category_name}</Link> › {p.name}
        </div>
      </div>

      <div className="d-grid">
        {/* key: đổi màu thì bộ ảnh quay về ảnh đầu tiên của màu đó */}
        <Gallery key={colorId} p={p} color={color} photos={photos} />

        <div className="panel d-info">
          <h1>{p.name}</h1>
          <p className="line">{p.short_desc}</p>

          {p.variants.length > 1 && (
            <>
              <div className="opt-label">Phiên bản</div>
              <div className="opts">
                {p.variants.map((v) => (
                  <button key={v.id} className="opt center" aria-pressed={v.id === variantId} onClick={() => setVariantId(v.id)}>{v.name}</button>
                ))}
              </div>
            </>
          )}

          <div className="opt-label">Màu sắc: <span className="muted-inline">{color.name}</span></div>
          <div className="opts colors">
            {p.colors.map((c) => {
              const thumb = photosOf(c.id)[0];
              return (
                <button key={c.id} className="opt color-opt" aria-pressed={c.id === colorId} onClick={() => setColorId(c.id)}>
                  {thumb
                    ? <ProductArt product={p} color={c.hex} image={thumb} width={96} className="copt-art" />
                    : <i className="sw big" style={{ background: c.hex }} />}
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pbox">
            <div className="row"><b className="num">{vnd(variant.price)}</b>{p.discount_amount > 0 && <s className="num">{vnd(variant.list_price)}</s>}</div>
            {p.discount_amount > 0 && <div className="save num">Tiết kiệm {vnd(p.discount_amount)} ({percentOff(variant.list_price, p.discount_amount)}%)</div>}
            {stock > 0 && stock <= 3 && <div className="stock low">Chỉ còn {stock} máy, đặt sớm kẻo hết</div>}
          </div>

          {stock === 0 ? (
            <div className="restock" role="status">
              <div className="restock-head">
                <b>SẮP VỀ HÀNG</b>
                <span>{p.name} {variant.name} màu {color.name}</span>
                <span>Vui lòng liên hệ <a className="num" href="tel:19000000">1900 0000</a> để đặt trước</span>
              </div>
              <div className="restock-actions">
                <a className="btn btn-primary" href="tel:19000000">Gọi đặt trước</a>
                <Link className="btn btn-line" to={catLink}>Xem sản phẩm khác</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="offers">
                <h3>Khuyến mãi</h3>
                <ol>
                  {p.gift_text && <li>{p.gift_text}</li>}
                  <li>Giảm thêm 5% khi mua kèm phụ kiện</li>
                  {p.category === 'dien-thoai' || p.category === 'laptop' ? <li>Trả góp 0% qua thẻ tín dụng, kỳ hạn 6 đến 12 tháng</li> : <li>Miễn phí giao hàng cho đơn từ 300.000đ</li>}
                </ol>
              </div>
              <div className="buy-row">
                <button className="btn btn-primary" onClick={() => { addToCart(); cart.setOpen(true); }}>
                  MUA NGAY<small>Giao nhanh 2 giờ hoặc nhận tại cửa hàng</small>
                </button>
                <button className="btn btn-line" onClick={addToCart} aria-label="Thêm vào giỏ hàng"><Icon name="cartPlus" size={22} /></button>
              </div>
              {(p.category === 'dien-thoai' || p.category === 'laptop') && (
                <div className="inst-row">
                  <button className="btn" onClick={() => cart.notify('Gọi 1900 0000 để được tư vấn trả góp')}>
                    <span className="num">Trả góp 0% · từ {vnd(Math.round(variant.price / 12 / 1000) * 1000)}/tháng</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`d-lower${sections.length ? '' : ' no-desc'}`}>
        {sections.length > 0 && <Description name={p.name} sections={sections} />}
        <div className="d-side">
          <div className="panel">
            <h2>Thông số kỹ thuật</h2>
            {p.specs.length ? (
              <table className="specs"><tbody>
                {p.specs.map((s) => <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>)}
              </tbody></table>
            ) : <p className="muted">Thông số chi tiết đang được cập nhật. Gọi 1900 0000 để được tư vấn.</p>}
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

// Khung ảnh lớn + nút trái/phải + dãy ảnh nhỏ. Vuốt ngang trên điện thoại cũng chuyển ảnh.
function Gallery({ p, color, photos }) {
  const [i, setI] = useState(0);
  const touchX = useRef(null);
  const n = photos.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  if (n === 0) {
    return (
      <div className="panel gallery">
        <ProductArt product={p} color={color.hex} width={900} className="d-art" />
      </div>
    );
  }

  return (
    <div className="panel gallery">
      <div
        className="stage"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
          if (n > 1 && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <ProductArt product={p} color={color.hex} image={photos[i]} width={900} className="d-art" />
        {n > 1 && (
          <>
            <button className="nav prev" onClick={() => go(-1)} aria-label="Ảnh trước">‹</button>
            <button className="nav next" onClick={() => go(1)} aria-label="Ảnh sau">›</button>
            <span className="count num">{i + 1}/{n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="thumbs">
          {photos.map((url, k) => (
            <button key={url + k} aria-label={`Xem ảnh ${k + 1}`} aria-pressed={k === i} onClick={() => setI(k)}>
              <ProductArt product={p} image={url} width={160} className="thumb-art" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Bài viết mô tả: dài quá thì thu gọn, bấm "Xem thêm" để mở hết
function Description({ name, sections }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > 760);
    check();
    // Ảnh tải xong làm bài dài ra, nên đo lại
    const imgs = [...el.querySelectorAll('img')];
    imgs.forEach((img) => img.addEventListener('load', check));
    return () => imgs.forEach((img) => img.removeEventListener('load', check));
  }, [sections]);

  return (
    <section className="panel desc">
      <h2>Đặc điểm nổi bật</h2>
      <div ref={ref} className={`desc-body${long && !open ? ' clamp' : ''}`}>
        {sections.map((se, k) => (
          <article key={k} className="desc-sec">
            {se.title && <h3>{se.title}</h3>}
            {se.body && se.body.split(/\n+/).map((line, j) => <p key={j}>{line}</p>)}
            {se.image && <img src={cdn(se.image, 1000, false)} alt={se.title || name} loading="lazy" decoding="async" />}
          </article>
        ))}
      </div>
      {long && (
        <button className="btn btn-line desc-toggle" onClick={() => {
          if (open) ref.current.parentElement.scrollIntoView({ block: 'start' });
          setOpen(!open);
        }}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </section>
  );
}
