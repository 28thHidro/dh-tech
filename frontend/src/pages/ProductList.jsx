// Dùng chung cho trang Danh mục (/danh-muc/:slug) và trang Tìm kiếm (/tim-kiem?q=)
import { Link, useParams, useSearchParams } from 'react-router';
import ProductCard from '../components/ProductCard.jsx';
import Commitments from '../components/Commitments.jsx';
import { ErrorBox, SkeletonGrid } from '../components/States.jsx';
import { useApi } from '../lib/api.js';
import { brandLabel } from '../lib/format.js';

const PRICES = [['', 'Tất cả'], ['u1', 'Dưới 1 triệu'], ['1-10', '1 – 10 triệu'], ['10-20', '10 – 20 triệu'], ['20-40', '20 – 40 triệu'], ['o40', 'Trên 40 triệu']];
const PRICE_TEST = {
  u1: (p) => p.min_price < 1e6,
  '1-10': (p) => p.min_price >= 1e6 && p.min_price < 1e7,
  '10-20': (p) => p.min_price >= 1e7 && p.min_price < 2e7,
  '20-40': (p) => p.min_price >= 2e7 && p.min_price <= 4e7,
  o40: (p) => p.min_price > 4e7,
};

export default function ProductList({ mode }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const brand = params.get('brand') || '';
  const price = params.get('price') || '';
  const sort = params.get('sort') || 'featured';
  const q = params.get('q') || '';

  // Đổi một tham số trên URL, giữ nguyên các tham số khác.
  // Nhờ để bộ lọc trên URL, người dùng copy link gửi bạn bè là thấy đúng kết quả.
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'featured') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const { data: cats } = useApi('/api/categories');
  const allCats = (cats ?? []).flatMap((c) => [c, ...c.children]);
  const cat = allCats.find((c) => c.slug === slug);

  // Lấy cả danh mục một lần; lọc theo hãng và giá ngay trên trình duyệt cho nhanh
  const query = new URLSearchParams({ sort });
  if (mode === 'search') query.set('q', q); else query.set('category', slug);
  const { data, error, loading, reload } = useApi(mode === 'search' && !q.trim() ? null : `/api/products?${query}`);

  const all = data?.items ?? [];
  // Danh sách hãng lấy từ chính các sản phẩm đang có, nên thêm hãng mới là tự hiện
  const brands = [...new Map(all.filter((p) => p.brand_slug).map((p) => [p.brand_slug, brandLabel(p.brand_slug, p.brand, slug)])).entries()];
  const items = all.filter((p) => (!brand || p.brand_slug === brand) && (!price || PRICE_TEST[price](p)));

  const brandName = brands.find(([k]) => k === brand)?.[1];
  const title = mode === 'search'
    ? `Kết quả cho “${q}”`
    : brand && brandName ? (slug === 'dien-thoai' && brand !== 'apple' ? `Điện thoại ${brandName}` : slug === 'laptop' && brand !== 'apple' ? `Laptop ${brandName}` : brandName)
    : cat?.name ?? 'Danh mục';

  return (
    <div className="wrap">
      <div className="page-head">
        <div className="crumbs">
          <Link to="/">Trang chủ</Link>
          {brand && cat ? <> › <Link to={`/danh-muc/${slug}`}>{cat.name}</Link></> : null} › {title}
        </div>
        <h1>{title}</h1>
        {data && <p className="muted">{items.length} sản phẩm</p>}
      </div>

      <div className="filters">
        {brands.length > 1 && (
          <div className="fgroup">
            <span className="lbl">Hãng</span>
            <button className="tab" aria-pressed={!brand} onClick={() => setParam('brand', '')}>Tất cả</button>
            {brands.map(([k, l]) => <button key={k} className="tab" aria-pressed={brand === k} onClick={() => setParam('brand', k)}>{l}</button>)}
          </div>
        )}
        <div className="fgroup">
          <span className="lbl">Mức giá</span>
          {PRICES.map(([k, l]) => <button key={l} className="tab" aria-pressed={price === k} onClick={() => setParam('price', k)}>{l}</button>)}
        </div>
        <select id="sort" aria-label="Sắp xếp" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          <option value="featured">Nổi bật</option>
          <option value="price_asc">Giá thấp đến cao</option>
          <option value="price_desc">Giá cao đến thấp</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>

      {error ? <ErrorBox error={error} onRetry={reload} />
        : loading ? <SkeletonGrid />
        : items.length ? <div className="grid">{items.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        : <div className="empty">Chưa có sản phẩm phù hợp. Thử bỏ bớt bộ lọc, hoặc tìm “MacBook”, “S26”, “sạc”.</div>}

      <section className="sec"><Commitments /></section>
    </div>
  );
}
