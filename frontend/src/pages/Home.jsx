// Trang chủ: mục tiêu là thu hút trước (video, deal, cửa hàng), thông tin chi tiết để ở trang sản phẩm.
// Nội dung (video, banner, deal, cửa hàng) sửa trong src/data/home.js.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductArt from '../components/ProductArt.jsx';
import Commitments from '../components/Commitments.jsx';
import Mascot from '../components/Mascot.jsx';
import Storefront from '../components/Storefront.jsx';
import { ErrorBox, SkeletonGrid } from '../components/States.jsx';
import { cdn, useApi } from '../lib/api.js';
import { brandLabel, percentOff, vnd } from '../lib/format.js';
import { HERO, NEW_ARRIVALS, SHOWCASE, SLIDES, STORE, STRIP, VIDEOS } from '../data/home.js';

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

const ytThumb = (id, hi) => `https://i.ytimg.com/vi/${id}/${hi ? 'maxresdefault' : 'hqdefault'}.jpg`;

// ---------------------------------------------------------------------
// 1. Video đại diện đầu trang: chọn theo ngày hôm nay
// ---------------------------------------------------------------------
function pickHero() {
  const today = new Date().toISOString().slice(0, 10);
  return HERO.find((h) => h.from && h.to && h.from <= today && today <= h.to)
    ?? HERO.find((h) => !h.from && !h.to) ?? HERO[0];
}

// Tắt phụ đề của video YouTube chạy nền: gửi lệnh "unloadModule captions" cho trình phát.
// Gửi vài lần vì trình phát cần thời gian khởi động.
function hideCaptions(e) {
  const win = e.currentTarget.contentWindow;
  const send = () => {
    win?.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: ['captions'] }), '*');
    win?.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: ['cc'] }), '*');
  };
  [500, 1500, 3000, 6000].forEach((t) => setTimeout(send, t));
}

function HeroVideo() {
  const h = useMemo(pickHero, []);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef();
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!h) return null;
  const poster = h.poster ? cdn(h.poster, 1600, false) : h.youtube ? ytThumb(h.youtube, true) : undefined;

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  return (
    <section className="hero">
      <div className="hero-media" aria-hidden="true">
        {poster && <img className="hero-poster" src={poster} alt="" />}
        {!reduce && h.mp4 && (
          <video ref={videoRef} src={h.mp4} poster={poster} autoPlay muted loop playsInline />
        )}
        {!reduce && !h.mp4 && h.youtube && (
          // Video YouTube chạy nền: tắt tiếng, tự lặp, không có nút điều khiển
          <iframe
            className="hero-yt" tabIndex={-1} title={h.title}
            src={`https://www.youtube-nocookie.com/embed/${h.youtube}?autoplay=1&mute=1&loop=1&playlist=${h.youtube}&controls=0&rel=0&playsinline=1&modestbranding=1&disablekb=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1`}
            allow="autoplay; encrypted-media"
            onLoad={hideCaptions}
          />
        )}
      </div>
      <div className="hero-shade" />
      <div className="wrap hero-copy">
        <span className="k">{h.kicker}</span>
        <h1>{h.title}</h1>
        <p>{h.text}</p>
        <div className="hero-cta">
          <Link className="btn btn-primary" to={h.cta[1]}>{h.cta[0]}</Link>
          {h.cta2 && (h.cta2[1].startsWith('#')
            ? <a className="btn hero-ghost" href={h.cta2[1]}>{h.cta2[0]}</a>
            : <Link className="btn hero-ghost" to={h.cta2[1]}>{h.cta2[0]}</Link>)}
          {h.mp4 && (
            <button className="btn hero-ghost" onClick={toggleSound}>{muted ? 'Bật tiếng' : 'Tắt tiếng'}</button>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// 2. Deal hot dạng "bento": một deal lớn có linh vật cầm biển, các deal nhỏ xung quanh
// ---------------------------------------------------------------------
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

function DealCard({ p, big }) {
  const off = percentOff(p.min_list_price, p.discount_amount);
  const low = p.total_stock > 0 && p.total_stock <= 10;
  return (
    <Link className={`deal${big ? ' big' : ''}`} to={`/san-pham/${p.slug}`}>
      {off > 0 && <span className="deal-off">-{off}%</span>}
      <ProductArt product={p} image={p.image} width={big ? 640 : 320} className="deal-art" />
      <div className="deal-info">
        <h3>{p.name}</h3>
        <div className="deal-price"><b className="num">{vnd(p.min_price)}</b>{p.discount_amount > 0 && <s className="num">{vnd(p.min_list_price)}</s>}</div>
        {p.total_stock === 0 ? <span className="deal-stock out">Sắp về hàng</span>
          : low ? <span className="deal-stock">Chỉ còn {p.total_stock} máy</span> : null}
      </div>
      {big && (
        <div className="deal-cat" aria-hidden="true">
          <span className="sign">GIÁ SỐC</span>
          <Mascot size={92} mood="phone" />
        </div>
      )}
    </Link>
  );
}

function Deals({ hot, loading }) {
  const [h, m, s] = useCountdown();
  return (
    <section className="deals reveal" id="deal">
      <div className="deals-head">
        <h2><span className="bolt"><Icon name="bolt" size={18} /></span>Deal độc quyền tuần này</h2>
        <div className="timer" aria-label="Thời gian còn lại">Kết thúc sau <b className="num">{h}</b>:<b className="num">{m}</b>:<b className="num">{s}</b></div>
      </div>
      {loading ? <SkeletonGrid count={4} /> : (
        <div className="deal-grid">
          {/* Ô lớn chiếm 4 ô nhỏ: lấy 1 + 4 hoặc 1 + 8 deal để lưới luôn kín, không bị hở */}
          {hot.slice(0, hot.length >= 9 ? 9 : 5).map((p, i) => <DealCard key={p.slug} p={p} big={i === 0} />)}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// 3. Banner trượt (bên trái) + cửa hàng có linh vật (bên phải)
// ---------------------------------------------------------------------
function Banner({ products }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = SLIDES.map((s) => ({ ...s, p: products?.find((p) => p.slug === s.slug) })).filter((s) => s.p);

  useEffect(() => {
    if (paused || slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length, cur, paused]);

  if (!slides.length) return <section className="banner banner-empty" aria-busy="true" />;

  return (
    <section className="banner" aria-label="Sản phẩm nổi bật" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="btabs" role="tablist" aria-label="Chọn banner">
        {slides.map((s, i) => (
          <button key={s.slug} role="tab" aria-selected={i === cur} onClick={() => setCur(i)}>
            <b>{s.tab[0]}</b><span>{s.tab[1]}</span>
          </button>
        ))}
      </div>
      <div className="slides">
        {slides.map((s, i) => (
          s.image ? (
            <Link key={s.slug} to={`/san-pham/${s.slug}`} className={`slide slide-img${i === cur ? ' on' : ''}`} aria-hidden={i !== cur} tabIndex={i === cur ? 0 : -1}>
              <img src={cdn(s.image, 1300, false)} alt={`${s.title[0]} ${s.title[1]}`} />
            </Link>
          ) : (
            <div key={s.slug} className={`slide${i === cur ? ' on' : ''}`} aria-hidden={i !== cur} style={{ '--slide-bg': s.bg }}>
              {s.big && <span className="slide-big" aria-hidden="true">{s.big}</span>}
              <div className="slide-copy">
                <div className="eb">{s.eyebrow}</div>
                <h2>{s.title[0]}<br />{s.title[1]}</h2>
                <p>{s.text}</p>
                <div className="from">Giá chỉ từ<b className="num">{vnd(s.p.min_price)}</b></div>
                <Link className="btn btn-primary" to={`/san-pham/${s.slug}`} tabIndex={i === cur ? 0 : -1}>Mua ngay</Link>
              </div>
              <ProductArt product={s.p} image={s.p.image} width={700} className="slide-art" />
            </div>
          )
        ))}
        <div className="dots-nav">
          {slides.map((s, i) => (
            <button key={s.slug} aria-label={`Banner ${i + 1}`} aria-current={i === cur} onClick={() => setCur(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreCard() {
  return (
    <section className="store-card" aria-label={STORE.title}>
      <div className="store-scene">
        <Storefront />
        <Mascot size={78} className="store-cat" />
        <span className="store-bubble">Vào xem máy nè!</span>
      </div>
      <div className="store-copy">
        <h2>{STORE.title}</h2>
        <p>{STORE.text}</p>
        <div className="store-meta"><span>Mở cửa {STORE.hours}</span><a className="num" href={`tel:${STORE.phone.replace(/\s/g, '')}`}>Hotline {STORE.phone}</a></div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// 4. Mới ra mắt: thẻ lớn trượt ngang
// ---------------------------------------------------------------------
function NewArrivals({ products }) {
  const rail = useRef();
  const list = NEW_ARRIVALS.map((n) => ({ ...n, p: products.find((p) => p.slug === n.slug) })).filter((n) => n.p);
  if (!list.length) return null;
  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="sec reveal">
      <div className="sec-head">
        <h2>Mới ra mắt. <span className="soft">Vừa lên kệ tuần này.</span></h2>
        <div className="rail-nav">
          <button onClick={() => scroll(-1)} aria-label="Xem trước">‹</button>
          <button onClick={() => scroll(1)} aria-label="Xem tiếp">›</button>
        </div>
      </div>
      <div className="na-rail" ref={rail}>
        {list.map(({ p, kicker, tagline }) => (
          <Link key={p.slug} className="na-card" to={`/san-pham/${p.slug}`}>
            <span className="k">{kicker}</span>
            <h3>{p.name}</h3>
            <p>{tagline}</p>
            <span className="na-price num">Từ {vnd(p.min_price)}</span>
            <ProductArt product={p} image={p.image} width={520} className="na-art" />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// 5. Video dạng "rạp chiếu": một màn hình lớn + danh sách bên cạnh
// ---------------------------------------------------------------------
function VideoTheater({ products }) {
  const [cur, setCur] = useState(0);
  const [play, setPlay] = useState(false);
  const [tab, setTab] = useState('');
  if (!VIDEOS.length) return null;
  const statuses = [...new Set(VIDEOS.map((v) => v.status).filter(Boolean))];
  const list = VIDEOS.filter((v) => !tab || v.status === tab);
  const v = list[Math.min(cur, list.length - 1)];
  const product = products.find((p) => p.slug === v.slug);
  const pickTab = (t) => { setTab(t); setCur(0); setPlay(false); };

  return (
    <section className="theater reveal">
      <div className="theater-head">
        <h2>Xem trước khi mua</h2>
        {statuses.length > 1 && (
          <div className="tabs" role="group" aria-label="Lọc video">
            <button className="tab" aria-pressed={!tab} onClick={() => pickTab('')}>Tất cả</button>
            {statuses.map((s) => <button key={s} className="tab" aria-pressed={tab === s} onClick={() => pickTab(s)}>{s}</button>)}
          </div>
        )}
      </div>
      <div className="theater-body">
        <div className="screen">
          {play ? (
            <iframe key={v.id} src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <button className="screen-cover" onClick={() => setPlay(true)} aria-label={`Phát video ${v.title}`}>
              <img src={ytThumb(v.id, true)} onError={(e) => { e.currentTarget.src = ytThumb(v.id); }} alt="" />
              <span className="vplay big" aria-hidden="true" />
              <span className="screen-title">
                {v.status && <em>{v.status}</em>}
                <b>{v.title}</b>
              </span>
            </button>
          )}
        </div>
        <div className="playlist">
          {list.map((x, i) => (
            <button key={x.id} className="pl-item" aria-current={x.id === v.id} onClick={() => { setCur(i); setPlay(true); }}>
              <span className="pl-thumb"><img src={ytThumb(x.id)} alt="" loading="lazy" /><span className="vplay sm" aria-hidden="true" /></span>
              <span className="pl-text">
                <b>{x.title}</b>
                <small>{x.by}{x.when ? ` · ${x.when}` : ''}</small>
              </span>
            </button>
          ))}
          {product && (
            <Link className="pl-buy" to={`/san-pham/${product.slug}`}>
              <ProductArt product={product} image={product.image} width={120} className="pl-art" />
              <span className="pl-buy-text"><small>Sản phẩm trong video</small><b>{product.name}</b><em className="num">Từ {vnd(product.min_price)}</em></span>
              <span className="go">Mua ›</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// 6. Khối giới thiệu tràn màn hình, dải deal ngang
// ---------------------------------------------------------------------
function Showcase({ products }) {
  const [video, setVideo] = useState(false);
  const p = products.find((x) => x.slug === SHOWCASE.slug);
  if (!p) return null;
  return (
    <section className="showcase reveal">
      <div className="sc-copy">
        <span className="k">{SHOWCASE.kicker}</span>
        <h2>{SHOWCASE.title}</h2>
        <p>{SHOWCASE.text}</p>
        <div className="sc-cta">
          <Link className="btn btn-primary" to={`/san-pham/${p.slug}`}>Mua ngay · từ {vnd(p.min_price)}</Link>
          {SHOWCASE.video && <button className="btn sc-ghost" onClick={() => setVideo(true)}>▶ Xem video</button>}
        </div>
      </div>
      <div className="sc-stage">
        {video ? (
          <div className="sc-video">
            <iframe src={`https://www.youtube-nocookie.com/embed/${SHOWCASE.video}?autoplay=1&rel=0`} title={SHOWCASE.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        ) : (
          <ProductArt product={p} image={p.image} width={900} className="sc-art" />
        )}
      </div>
    </section>
  );
}

function Strip() {
  if (STRIP.image) {
    return <Link className="strip strip-img reveal" to={STRIP.to}><img src={cdn(STRIP.image, 1300, false)} alt={STRIP.title} loading="lazy" /></Link>;
  }
  return (
    <Link className="strip reveal" to={STRIP.to}>
      <div className="strip-copy">
        <span className="k">{STRIP.kicker}</span>
        <h2>{STRIP.title}</h2>
        <p>{STRIP.text}</p>
      </div>
      <span className="strip-cta">Săn deal ngay ›</span>
      <Mascot size={96} className="strip-cat" />
    </Link>
  );
}

// ---------------------------------------------------------------------
// 7. Khu sản phẩm theo danh mục: một sản phẩm "tâm điểm" lớn bên trái, lưới nhỏ bên phải
// ---------------------------------------------------------------------
function Spotlight({ title, items, category, loading, tone }) {
  const [brand, setBrand] = useState('');
  const list = items.filter((p) => !brand || p.brand_slug === brand);
  const brands = [...new Map(items.filter((p) => p.brand_slug).map((p) => [p.brand_slug, brandLabel(p.brand_slug, p.brand, category)])).entries()];
  const link = brand ? `/danh-muc/${category}?brand=${brand}` : `/danh-muc/${category}`;
  const [star, ...rest] = list;
  return (
    <section className="sec reveal">
      <div className="sec-head">
        <h2>{title}</h2>
        <div className="tabs" role="group" aria-label="Lọc theo hãng">
          {brands.length > 1 && <button className="tab" aria-pressed={!brand} onClick={() => setBrand('')}>Tất cả</button>}
          {brands.length > 1 && brands.map(([k, l]) => <button key={k} className="tab" aria-pressed={brand === k} onClick={() => setBrand(k)}>{l}</button>)}
          <Link className="more" to={link}>Xem tất cả ›</Link>
        </div>
      </div>
      {loading ? <SkeletonGrid /> : star && (
        <div className="spot">
          <Link className={`spot-star ${tone}`} to={`/san-pham/${star.slug}`}>
            <span className="k">Nổi bật</span>
            <h3>{star.name}</h3>
            {star.short_desc && <p>{star.short_desc}</p>}
            <div className="spot-price num">Từ <b>{vnd(star.min_price)}</b></div>
            <span className="btn btn-primary">Xem ngay</span>
            <ProductArt product={star} image={star.image} width={600} className="spot-art" />
          </Link>
          <div className="spot-grid">{rest.slice(0, 6).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        </div>
      )}
    </section>
  );
}

// Các khối có lớp "reveal" hiện dần lên khi cuộn tới
function useReveal(deps) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.reveal:not(.in)')];
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function Home() {
  const { data, error, loading, reload } = useApi('/api/products');
  const items = data?.items ?? [];
  const hot = items.filter((p) => p.is_hot);
  const phones = items.filter((p) => p.category === 'dien-thoai');
  const laptops = items.filter((p) => p.category === 'laptop');
  const accessories = items.filter((p) => p.parent_category === 'phu-kien');
  const waiting = loading && !data;
  useReveal([waiting]);

  return (
    <>
      <HeroVideo />
      <div className="wrap">
        <div className="quick pills">
          {QUICK.map(([icon, label, to]) => (
            <Link key={label} to={to}><span className="ic"><Icon name={icon} size={20} /></span>{label}</Link>
          ))}
        </div>

        {error && <ErrorBox error={error} onRetry={reload} />}

        <Deals hot={hot} loading={waiting} />

        <div className="duo reveal">
          <Banner products={items} />
          <StoreCard />
        </div>

        <NewArrivals products={items} />
        <VideoTheater products={items} />
        <Strip />
        <Showcase products={items} />

        <Spotlight title="Điện thoại" items={phones} category="dien-thoai" loading={waiting} tone="warm" />
        <Spotlight title="Laptop" items={laptops} category="laptop" loading={waiting} tone="cool" />

        <section className="sec reveal">
          <div className="sec-head"><h2>Phụ kiện công nghệ</h2><Link className="more" to="/danh-muc/phu-kien">Xem tất cả ›</Link></div>
          {waiting ? <SkeletonGrid /> : <div className="rail">{accessories.slice(0, 12).map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
        </section>

        <section className="sec reveal"><Commitments /></section>
      </div>
    </>
  );
}
