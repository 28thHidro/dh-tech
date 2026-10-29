import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ProductArt from '../components/ProductArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBox } from '../components/States.jsx';
import { cdn, useApi } from '../lib/api.js';
import { useCart } from '../lib/cart.jsx';
import { brandLabel, percentOff, vnd } from '../lib/format.js';
import { useReveal } from '../lib/reveal.js';

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
  if (loading || !p) return <div className="wrap"><div className="d-grid pd-top"><div className="panel sk sk-panel" /><div className="panel sk sk-panel" /></div></div>;
  // key={p.slug}: sang sản phẩm khác thì làm mới toàn bộ lựa chọn
  return <ProductDetail key={p.slug} p={p} />;
}

// Chọn icon cho một dòng thông số dựa vào tên nhóm và tên thông số
const ICON_RULES = [
  [/camera trước|selfie/i, 'selfie'],
  [/camera|zoom|quay video/i, 'camera'],
  [/màn hình|tần số quét|độ sáng|độ phân giải/i, 'screen'],
  [/âm thanh|chống ồn|màng loa/i, 'speaker'],
  [/pin|sạc|thời lượng|dung lượng|công suất/i, 'battery'],
  [/kết nối|bluetooth|wi-fi|mạng|cổng|chế độ|tương thích/i, 'wifi'],
  [/thiết kế|kích thước|trọng lượng|kháng nước|layout|cấu trúc|chất liệu|vỏ|khung/i, 'ruler'],
  [/cấu hình|hiệu năng|chip|cpu|gpu|ram|bộ nhớ|ổ cứng|neural|cảm biến|dpi/i, 'cpu'],
];
const iconFor = (s) => ICON_RULES.find(([re]) => re.test(`${s.group} ${s.label}`))?.[1] ?? 'sparkle';

// Gom thông số theo nhóm, giữ đúng thứ tự xuất hiện
function groupSpecs(specs) {
  const map = new Map();
  for (const s of specs) {
    const g = s.group || 'Thông số chung';
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(s);
  }
  return [...map].map(([name, rows]) => ({ name, rows }));
}

const isBigTicket = (p) => ['dien-thoai', 'laptop'].includes(p.category) || p.parent_category === 'dong-ho' || p.category === 'dong-ho';

function ProductDetail({ p }) {
  const cart = useCart();
  const navigate = useNavigate();
  const [specOpen, setSpecOpen] = useState(null); // null = đóng, còn lại là tên nhóm cần mở

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
  const photosOf = (cId) => {
    const own = p.images.filter((i) => i.color_id === cId).map((i) => i.url);
    const shared = p.images.filter((i) => !i.color_id).map((i) => i.url);
    return [...own, ...shared];
  };
  const photos = photosOf(colorId);
  const image = photos[0];

  const groups = useMemo(() => groupSpecs(p.specs ?? []), [p.specs]);
  const keySpecs = useMemo(() => {
    const marked = (p.specs ?? []).filter((s) => s.key);
    return (marked.length ? marked : p.specs ?? []).slice(0, 6);
  }, [p.specs]);
  const highlights = (p.highlights ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const sections = p.sections ?? [];

  useEffect(() => { document.title = `${p.name} | DH tech`; return () => { document.title = 'DH tech - Công nghệ đến gần bạn hơn'; }; }, [p.name]);

  const { data: related } = useApi(`/api/products?category=${p.category}`);
  const others = (related?.items ?? []).filter((x) => x.slug !== p.slug).slice(0, 5);
  useReveal([p.slug, others.length]);

  const addToCart = () => cart.add({
    skuId: sku?.id, image,
    slug: p.slug, name: p.name, brand_slug: p.brand_slug, category: p.category,
    variantId, variantName: variant.name, colorId, colorName: color.name, hex: color.hex,
    price: variant.price, listPrice: variant.list_price,
  });

  const catLink = p.brand_slug ? `/danh-muc/${p.category}?brand=${p.brand_slug}` : `/danh-muc/${p.category}`;

  // Thanh mục lục dính trên đầu khi cuộn xuống phần chi tiết
  const navItems = [
    keySpecs.length > 0 && ['pd-key', 'Thông số nổi bật'],
    sections.length > 0 && ['pd-desc', 'Đặc điểm nổi bật'],
    ['pd-specs', 'Thông số kỹ thuật'],
    ['pd-promise', 'Cam kết'],
    others.length > 0 && ['pd-related', 'Sản phẩm tương tự'],
  ].filter(Boolean);

  return (
    <div className="wrap pd">
      <div className="page-head compact">
        <nav className="crumbs" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          {p.parent_category && <> › <Link to={`/danh-muc/${p.parent_category}`}>{p.parent_name}</Link></>}
          {' › '}<Link to={catLink}>{p.brand_slug ? brandLabel(p.brand_slug, p.brand, p.category) : p.category_name}</Link>
          {' › '}<span aria-current="page">{p.name}</span>
        </nav>
      </div>

      <div className="d-grid pd-top">
        <div className="pd-left">
          {/* key: đổi màu thì bộ ảnh quay về ảnh đầu tiên của màu đó */}
          <Gallery key={colorId} p={p} color={color} photos={photos} />
          {highlights.length > 0 && (
            <section className="panel pd-hl" aria-labelledby="hl-title">
              <h2 id="hl-title"><Icon name="sparkle" size={18} /> Thông tin nổi bật</h2>
              <ul>
                {highlights.map((h, k) => <li key={k} style={{ '--d': `${k * 70}ms` }}><Icon name="check" size={16} />{h}</li>)}
              </ul>
            </section>
          )}
        </div>

        <div className="panel d-info pd-info">
          {p.brand && <span className="pd-brand">{p.brand}</span>}
          <h1>{p.name}</h1>
          <p className="line">{p.short_desc}</p>

          {keySpecs.length > 0 && (
            <ul className="pd-chips" aria-label="Thông số chính">
              {keySpecs.slice(0, 4).map((s) => (
                <li key={s.label}><Icon name={iconFor(s)} size={16} /><span>{s.value}</span></li>
              ))}
            </ul>
          )}

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
            {/* key theo giá: đổi phiên bản thì giá "nảy" nhẹ cho dễ thấy */}
            <div className="row pd-price" key={variant.id}><b className="num">{vnd(variant.price)}</b>{p.discount_amount > 0 && <s className="num">{vnd(variant.list_price)}</s>}</div>
            {p.discount_amount > 0 && <div className="save num">Tiết kiệm {vnd(p.discount_amount)} ({percentOff(variant.list_price, p.discount_amount)}%)</div>}
            {stock > 0 && stock <= 3 && <div className="stock low">Chỉ còn {stock} sản phẩm, đặt sớm kẻo hết</div>}
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
                  {isBigTicket(p) ? <li>Trả góp 0% qua thẻ tín dụng, kỳ hạn 6 đến 12 tháng</li> : <li>Miễn phí giao hàng cho đơn từ 300.000đ</li>}
                </ol>
              </div>
              <div className="buy-row">
                <button className="btn btn-primary pd-buy" onClick={() => { addToCart(); cart.setOpen(true); }}>
                  MUA NGAY<small>Giao nhanh 2 giờ hoặc nhận tại cửa hàng</small>
                </button>
                <button className="btn btn-line" onClick={addToCart} aria-label="Thêm vào giỏ hàng"><Icon name="cartPlus" size={22} /></button>
              </div>
              {isBigTicket(p) && (
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

      <SectionNav items={navItems} />

      {keySpecs.length > 0 && (
        <section id="pd-key" className="pd-key" aria-labelledby="key-title">
          <div className="pd-key-head reveal">
            <span className="k">Thông số nổi bật</span>
            <h2 id="key-title">{p.name}</h2>
          </div>
          <div className="pd-key-grid" style={{ '--cols': keySpecs.length <= 4 ? keySpecs.length : 3 }}>
            {keySpecs.map((s, k) => (
              <button key={s.label} className="pd-tile reveal" style={{ '--d': `${k * 80}ms` }} onClick={() => setSpecOpen(s.group || 'Thông số chung')}>
                <Icon name={iconFor(s)} size={26} />
                <span className="lbl">{s.label}</span>
                <b>{s.value}</b>
                <span className="more">Xem {s.group || 'chi tiết'} ›</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className={`d-lower${sections.length ? '' : ' no-desc'}`}>
        {sections.length > 0 && <Description name={p.name} sections={sections} />}
        <div className="d-side">
          <div id="pd-specs" className="panel pd-specs reveal">
            <h2>Thông số kỹ thuật</h2>
            {groups.length ? (
              <>
                {groups.slice(0, 2).map((g) => (
                  <div key={g.name} className="pd-sgroup">
                    <h3>{g.name}</h3>
                    <table className="specs"><tbody>
                      {g.rows.slice(0, 5).map((s) => <tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>)}
                    </tbody></table>
                  </div>
                ))}
                <button className="btn btn-line pd-all" onClick={() => setSpecOpen(groups[0].name)}>
                  <Icon name="list" size={18} /> Xem cấu hình chi tiết
                  <span className="muted num">{p.specs.length} thông số · {groups.length} nhóm</span>
                </button>
              </>
            ) : <p className="muted">Thông số chi tiết đang được cập nhật. Gọi 1900 0000 để được tư vấn.</p>}
          </div>
          <div id="pd-promise" className="panel reveal">
            <h2>Cam kết của DH tech</h2>
            <ol className="promise">
              <li>Hàng mới 100%, nguyên hộp, chính hãng.</li>
              <li>Bảo hành 12 tháng tại trung tâm bảo hành chính hãng.</li>
              <li>1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</li>
              <li>Giá đã bao gồm VAT.</li>
            </ol>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section id="pd-related" className="sec reveal">
          <div className="sec-head"><h2>Sản phẩm tương tự</h2><button className="more linkish" onClick={() => navigate(catLink)}>Xem thêm ›</button></div>
          <div className="grid">{others.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
        </section>
      )}

      {specOpen !== null && <SpecModal p={p} groups={groups} start={specOpen} onClose={() => setSpecOpen(null)} />}
    </div>
  );
}

// Thanh mục lục: bấm để cuộn tới phần tương ứng, phần đang xem được gạch chân
function SectionNav({ items }) {
  const [active, setActive] = useState(items[0]?.[0]);
  const navRef = useRef();
  const ids = items.map(([id]) => id).join(',');

  // Dính ngay dưới thanh đầu trang (cao thấp khác nhau giữa máy tính và điện thoại)
  useEffect(() => {
    const header = document.querySelector('header.top');
    const page = navRef.current?.closest('.pd');
    if (!header || !page) return;
    const set = () => page.style.setProperty('--hdr', `${header.offsetHeight}px`);
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  // Nút đang chọn luôn hiện trong thanh (điện thoại phải vuốt ngang)
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector('.on');
    if (btn) nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const els = ids.split(',').map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) setActive(seen.target.id);
    }, { rootMargin: '-180px 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = (document.querySelector('header.top')?.offsetHeight ?? 64) + 64;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setActive(id);
  };

  return (
    <nav className="pd-nav" aria-label="Mục lục sản phẩm" ref={navRef}>
      {items.map(([id, label]) => (
        <button key={id} className={active === id ? 'on' : ''} onClick={() => go(id)}>{label}</button>
      ))}
    </nav>
  );
}

// Bảng cấu hình chi tiết: các tab theo nhóm, bấm tab thì cuộn tới nhóm đó (giống CellphoneS)
function SpecModal({ p, groups, start, onClose }) {
  const bodyRef = useRef();
  const closeRef = useRef();
  const tabsRef = useRef();
  const [active, setActive] = useState(start);
  const [closing, setClosing] = useState(false);
  const lock = useRef(false); // đang cuộn do bấm tab thì không cập nhật tab theo vị trí

  const close = useCallback(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return onClose();
    setClosing(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  const jump = (name, smooth = true) => {
    const body = bodyRef.current;
    const el = body?.querySelector(`[data-group="${CSS.escape(name)}"]`);
    if (!el) return;
    lock.current = true;
    body.scrollTo({ top: el.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' });
    setActive(name);
    setTimeout(() => { lock.current = false; }, 500);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    jump(start, false);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab đang chọn luôn nằm trong tầm nhìn của thanh tab
  useEffect(() => {
    const tab = tabsRef.current?.querySelector('[aria-selected="true"]');
    tab?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const onScroll = () => {
    if (lock.current) return;
    const body = bodyRef.current;
    const blocks = [...body.querySelectorAll('[data-group]')];
    const cur = blocks.filter((b) => b.offsetTop - body.scrollTop <= 40).at(-1) ?? blocks[0];
    if (cur) setActive(cur.dataset.group);
  };

  return (
    <div className={`spec-modal${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sm-title" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="sm-sheet">
        <header className="sm-head">
          <div>
            <h2 id="sm-title">Thông số kỹ thuật</h2>
            <p className="muted">{p.name}</p>
          </div>
          <button ref={closeRef} className="sm-close" onClick={close} aria-label="Đóng"><Icon name="x" size={20} /></button>
        </header>
        <div className="sm-tabs" role="tablist" ref={tabsRef}>
          {groups.map((g) => (
            <button key={g.name} role="tab" aria-selected={active === g.name} onClick={() => jump(g.name)}>{g.name}</button>
          ))}
        </div>
        <div className="sm-body" ref={bodyRef} onScroll={onScroll}>
          {groups.map((g) => (
            <section key={g.name} data-group={g.name} className="sm-group">
              <h3><Icon name={iconFor({ group: g.name, label: '' })} size={18} />{g.name}</h3>
              <dl>
                {g.rows.map((s) => (
                  <div key={s.label} className={s.key ? 'key' : ''}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                ))}
              </dl>
            </section>
          ))}
          <p className="sm-note muted">Thông số theo công bố của nhà sản xuất, có thể thay đổi tuỳ lô hàng.</p>
        </div>
      </div>
    </div>
  );
}

// Khung ảnh: các ảnh xếp thành một dải, chuyển ảnh bằng trượt ngang.
// Rê chuột trên máy tính để phóng to, vuốt trên điện thoại để chuyển ảnh.
function Gallery({ p, color, photos }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null); // {x, y} theo phần trăm
  const touchX = useRef(null);
  const thumbsRef = useRef();
  const n = photos.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const t = thumbsRef.current?.children[i];
    t?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [i]);

  if (n === 0) {
    return (
      <div className="panel gallery pd-gallery">
        <ProductArt product={p} color={color.hex} width={900} className="d-art" />
      </div>
    );
  }

  const fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const onMove = (e) => {
    if (!fine) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="panel gallery pd-gallery">
      <div
        className="stage"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
          if (n > 1 && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <div className="pd-viewport" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
          <div className="pd-track" style={{ transform: `translateX(${-i * 100}%)` }}>
            {photos.map((url, k) => (
              <div key={url + k} className={`pd-slide${k === i ? ' on' : ''}`} aria-hidden={k !== i}>
                <img
                  src={cdn(url, 900)} alt={k === 0 ? `${p.name} màu ${color.name}` : `${p.name}, ảnh ${k + 1}`}
                  loading={k === 0 ? 'eager' : 'lazy'} decoding="async" draggable="false"
                  style={k === i && zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(1.8)' } : undefined}
                />
              </div>
            ))}
          </div>
        </div>
        {n > 1 && (
          <>
            <button className="nav prev" onClick={() => go(-1)} aria-label="Ảnh trước">‹</button>
            <button className="nav next" onClick={() => go(1)} aria-label="Ảnh sau">›</button>
            <span className="count num">{i + 1}/{n}</span>
            <div className="pd-dots" aria-hidden="true">{photos.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="thumbs" ref={thumbsRef}>
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

// Bài viết mô tả kiểu Apple: từng đoạn hiện dần khi cuộn, ảnh phóng nhẹ theo vị trí cuộn.
// Dài quá thì thu gọn, bấm "Xem thêm" để mở hết.
function Description({ name, sections }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > 1100);
    check();
    // Ảnh tải xong làm bài dài ra, nên đo lại
    const imgs = [...el.querySelectorAll('img')];
    imgs.forEach((img) => img.addEventListener('load', check));
    return () => imgs.forEach((img) => img.removeEventListener('load', check));
  }, [sections]);

  return (
    <section id="pd-desc" className="panel desc pd-desc">
      <h2>Đặc điểm nổi bật</h2>
      <div ref={ref} className={`desc-body${long && !open ? ' clamp' : ''}`}>
        {sections.map((se, k) => (
          <article key={k} className="desc-sec reveal">
            {se.title && <h3>{se.title}</h3>}
            {se.body && se.body.split(/\n+/).map((line, j) => <p key={j}>{line}</p>)}
            {se.image && (
              <figure className="desc-img">
                <img src={cdn(se.image, 1000, false)} alt={se.title || name} loading="lazy" decoding="async" />
              </figure>
            )}
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
