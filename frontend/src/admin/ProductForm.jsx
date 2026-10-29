// Form thêm / sửa sản phẩm
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { adminFetch, slugify, uploadImage } from '../lib/admin.js';
import { cdn } from '../lib/api.js';
import { vnd } from '../lib/format.js';

let keySeq = 0;
const k = () => `k${++keySeq}`; // khoá tạm cho React phân biệt các dòng, không gửi lên server

const EMPTY = {
  name: '', slug: '', category_id: '', brand_id: '', short_desc: '', discount_amount: 0, gift_text: '',
  is_hot: false, is_active: true,
  variants: [{ _k: k(), name: '', list_price: '' }],
  colors: [{ _k: k(), name: '', hex: '#1C1D20' }],
  stock: [[0]], specs: [], images: [], sections: [],
};

function fromServer(p) {
  return {
    ...p,
    brand_id: p.brand_id ?? '',
    short_desc: p.short_desc ?? '', gift_text: p.gift_text ?? '',
    variants: p.variants.map((v) => ({ ...v, _k: k() })),
    colors: p.colors.map((c) => ({ ...c, _k: k() })),
    specs: p.specs.map((s) => ({ ...s, _k: k() })),
    images: p.images.map((i) => ({ ...i, _k: k() })),
    sections: (p.sections ?? []).map((se) => ({ ...se, _k: k() })),
  };
}

function toServer(f) {
  const strip = ({ _k, ...rest }) => rest;
  return {
    name: f.name, slug: f.slug, short_desc: f.short_desc, gift_text: f.gift_text,
    category_id: Number(f.category_id), brand_id: f.brand_id ? Number(f.brand_id) : null,
    discount_amount: Number(f.discount_amount) || 0, is_hot: f.is_hot, is_active: f.is_active,
    variants: f.variants.map((v) => ({ ...strip(v), list_price: Number(v.list_price) })),
    colors: f.colors.map(strip),
    stock: f.stock.map((row) => row.map((n) => Number(n) || 0)),
    specs: f.specs.map(strip),
    images: f.images.map(strip),
    sections: f.sections.map(strip),
  };
}

// key: chuyển từ "Thêm mới" sang trang sửa (hoặc giữa hai sản phẩm) thì làm mới toàn bộ form
export default function ProductFormPage() {
  const { id } = useParams();
  return <ProductForm key={id || 'new'} id={id} />;
}

function ProductForm({ id }) {
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const { onAuthError } = useOutletContext();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [status, setStatus] = useState(location.state?.saved ? { type: 'ok', text: 'Đã tạo sản phẩm. Website đã hiển thị sản phẩm mới.' } : { type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadColor, setUploadColor] = useState(''); // ảnh tải lên được gắn sẵn màu này
  const fileRef = useRef();
  const sectionFileRef = useRef();
  const [sectionTarget, setSectionTarget] = useState(null); // đoạn mô tả đang chọn ảnh

  useEffect(() => {
    adminFetch('/api/admin/meta').then(setMeta).catch(onAuthError);
    if (!isNew) {
      adminFetch(`/api/admin/products/${id}`)
        .then((p) => setForm(fromServer(p)))
        .catch((err) => { setStatus({ type: 'error', text: err.message }); onAuthError(err); });
    }
  }, [id, isNew, onAuthError]);

  if (!form) {
    return status.text ? <div className="form-error">{status.text} <Link to="/admin">Về danh sách</Link></div>
      : <div className="admin-loading">Đang tải sản phẩm…</div>;
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setRow = (list, i, patch) => set({ [list]: form[list].map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  // --- Phiên bản: thêm/bớt một dòng thì thêm/bớt một hàng trong bảng tồn kho
  const addVariant = () => set({ variants: [...form.variants, { _k: k(), name: '', list_price: '' }], stock: [...form.stock, form.colors.map(() => 0)] });
  const removeVariant = (i) => set({ variants: form.variants.filter((_, j) => j !== i), stock: form.stock.filter((_, j) => j !== i) });

  // --- Màu: thêm/bớt một màu thì thêm/bớt một cột tồn kho, và sửa lại ảnh đang gắn với màu
  const addColor = () => set({ colors: [...form.colors, { _k: k(), name: '', hex: '#CCCCCC' }], stock: form.stock.map((row) => [...row, 0]) });
  const removeColor = (i) => set({
    colors: form.colors.filter((_, j) => j !== i),
    stock: form.stock.map((row) => row.filter((_, j) => j !== i)),
    images: form.images.map((img) => ({
      ...img,
      color_index: img.color_index == null || img.color_index === i ? null : img.color_index > i ? img.color_index - 1 : img.color_index,
    })),
  });
  const setStock = (vi, ci, value) => set({ stock: form.stock.map((row, a) => (a === vi ? row.map((n, b) => (b === ci ? value : n)) : row)) });

  const onFiles = async (files) => {
    const list = [...files];
    if (!list.length) return;
    setUploading((n) => n + list.length);
    setStatus({ type: '', text: '' });
    for (const file of list) {
      try {
        const url = await uploadImage(file);
        const color_index = uploadColor === '' ? null : Number(uploadColor);
        setForm((f) => ({ ...f, images: [...f.images, { _k: k(), url, color_index }] }));
      } catch (err) {
        setStatus({ type: 'error', text: err.message });
        onAuthError(err);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    fileRef.current.value = '';
  };

  // Đổi chỗ hai dòng trong một danh sách (ảnh, đoạn mô tả)
  const move = (list, i, dir) => {
    const arr = [...form[list]];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set({ [list]: arr });
  };
  const moveImage = (i, dir) => move('images', i, dir);

  // Ảnh cho một đoạn mô tả
  const onSectionFile = async (file) => {
    const target = sectionTarget;
    sectionFileRef.current.value = '';
    if (!file || target == null) return;
    setUploading((n) => n + 1);
    setStatus({ type: '', text: '' });
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, sections: f.sections.map((se) => (se._k === target ? { ...se, image_url: url } : se)) }));
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
      onAuthError(err);
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const body = toServer(form);
      const res = await adminFetch(isNew ? '/api/admin/products' : `/api/admin/products/${id}`, { method: isNew ? 'POST' : 'PUT', body });
      if (isNew) {
        navigate(`/admin/san-pham/${res.id}`, { replace: true, state: { saved: true } });
      } else {
        // Tải lại để nhận id của các phiên bản, màu vừa thêm
        setForm(fromServer(await adminFetch(`/api/admin/products/${id}`)));
        setStatus({ type: 'ok', text: 'Đã lưu. Website đã hiển thị thông tin mới.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
      onAuthError(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
      onAuthError(err);
    }
  };

  const discount = Number(form.discount_amount) || 0;

  return (
    <form onSubmit={save} className="pform">
      <div className="admin-head">
        <div>
          <div className="crumbs"><Link to="/admin">Sản phẩm</Link> › {isNew ? 'Thêm mới' : form.name}</div>
          <h1>{isNew ? 'Thêm sản phẩm' : form.name || 'Sửa sản phẩm'}</h1>
        </div>
        {!isNew && <a className="btn btn-line" href={`/san-pham/${form.slug}`} target="_blank" rel="noreferrer">Xem trên website ↗</a>}
      </div>

      {/* 1. Thông tin chung */}
      <section className="psec">
        <h2>Thông tin chung</h2>
        <div className="fgrid">
          <label className="span2">Tên sản phẩm
            <input id="f-name" required value={form.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="iPhone 18 Pro" />
          </label>
          <label className="span2">Đường dẫn (slug)
            <div className="slug-input"><span>/san-pham/</span><input id="f-slug" required value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} placeholder="iphone-18-pro" /></div>
            <small>Tự tạo từ tên. Đổi slug của sản phẩm đang bán sẽ làm hỏng các link cũ đã chia sẻ.</small>
          </label>
          <label>Danh mục
            <select id="f-cat" required value={form.category_id} onChange={(e) => set({ category_id: e.target.value })}>
              <option value="">Chọn danh mục</option>
              {meta?.categories.map((c) => <option key={c.id} value={c.id}>{c.parent_name ? `${c.parent_name} › ${c.name}` : c.name}</option>)}
            </select>
          </label>
          <label>Thương hiệu
            <select id="f-brand" value={form.brand_id} onChange={(e) => set({ brand_id: e.target.value })}>
              <option value="">Không có</option>
              {meta?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="span2">Mô tả ngắn
            <input id="f-desc" value={form.short_desc} maxLength={300} onChange={(e) => set({ short_desc: e.target.value })} placeholder="Nhỏ gọn 6.3 inch, chip A20 Pro" />
          </label>
          <label>Số tiền DH tech giảm (đ)
            <input id="f-discount" type="number" min="0" step="1000" value={form.discount_amount} onChange={(e) => set({ discount_amount: e.target.value })} />
            <small>Áp dụng cho mọi phiên bản.</small>
          </label>
          <label>Quà tặng / khuyến mãi
            <input id="f-gift" value={form.gift_text} maxLength={300} onChange={(e) => set({ gift_text: e.target.value })} placeholder="Tặng ốp lưng chính hãng" />
          </label>
          <div className="checks span2">
            <label className="check"><input id="f-active" type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} /> Đang bán (bỏ chọn để ẩn khỏi website)</label>
            <label className="check"><input id="f-hot" type="checkbox" checked={form.is_hot} onChange={(e) => set({ is_hot: e.target.checked })} /> Hiện trong mục Hot sale</label>
          </div>
        </div>
      </section>

      {/* 2. Phiên bản */}
      <section className="psec">
        <div className="psec-head"><h2>Phiên bản và giá</h2><button type="button" className="btn btn-line sm" onClick={addVariant}>+ Thêm phiên bản</button></div>
        <div className="rows">
          {form.variants.map((v, i) => (
            <div className="row" key={v._k}>
              <input aria-label={`Tên phiên bản ${i + 1}`} required value={v.name} onChange={(e) => setRow('variants', i, { name: e.target.value })} placeholder="256GB" />
              <input aria-label={`Giá niêm yết phiên bản ${i + 1}`} type="number" min="1000" step="1000" required value={v.list_price} onChange={(e) => setRow('variants', i, { list_price: e.target.value })} placeholder="Giá niêm yết" />
              <span className="hint num">{v.list_price ? <>Khách trả <b>{vnd(Math.max(0, Number(v.list_price) - discount))}</b></> : ''}</span>
              <button type="button" className="icon-btn" disabled={form.variants.length === 1} onClick={() => removeVariant(i)} aria-label="Xoá phiên bản">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Màu */}
      <section className="psec">
        <div className="psec-head"><h2>Màu sắc</h2><button type="button" className="btn btn-line sm" onClick={addColor}>+ Thêm màu</button></div>
        <div className="rows">
          {form.colors.map((c, i) => (
            <div className="row" key={c._k}>
              <input aria-label={`Tên màu ${i + 1}`} required value={c.name} onChange={(e) => setRow('colors', i, { name: e.target.value })} placeholder="Titan Đen" />
              <div className="color-field">
                <input type="color" aria-label={`Chọn màu ${i + 1}`} value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#000000'} onChange={(e) => setRow('colors', i, { hex: e.target.value.toUpperCase() })} />
                <input aria-label={`Mã màu ${i + 1}`} value={c.hex} onChange={(e) => setRow('colors', i, { hex: e.target.value })} maxLength={7} />
              </div>
              <span />
              <button type="button" className="icon-btn" disabled={form.colors.length === 1} onClick={() => removeColor(i)} aria-label="Xoá màu">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Tồn kho theo SKU */}
      <section className="psec">
        <h2>Tồn kho</h2>
        <p className="muted">Mỗi ô là một SKU: số máy còn trong kho của phiên bản và màu tương ứng. Ô bằng 0 sẽ hiện "Hết hàng" trên website.</p>
        <div className="table-wrap">
          <table className="stock-grid">
            <thead><tr><th />{form.colors.map((c) => <th key={c._k}><i className="sw" style={{ background: c.hex }} />{c.name || 'Màu mới'}</th>)}</tr></thead>
            <tbody>
              {form.variants.map((v, vi) => (
                <tr key={v._k}>
                  <th>{v.name || 'Phiên bản mới'}</th>
                  {form.colors.map((c, ci) => (
                    <td key={c._k}>
                      <input type="number" min="0" aria-label={`Tồn kho ${v.name} ${c.name}`} className={Number(form.stock[vi]?.[ci]) === 0 ? 'zero' : ''}
                        value={form.stock[vi]?.[ci] ?? 0} onChange={(e) => setStock(vi, ci, e.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Ảnh */}
      <section className="psec">
        <div className="psec-head">
          <h2>Ảnh sản phẩm</h2>
          <div className="upload-ctl">
            <select aria-label="Gắn ảnh sắp tải lên với màu" value={uploadColor} onChange={(e) => setUploadColor(e.target.value)}>
              <option value="">Tải lên làm ảnh chung</option>
              {form.colors.map((c, ci) => <option key={c._k} value={ci}>Tải lên cho màu {c.name || ci + 1}</option>)}
            </select>
            <button type="button" className="btn btn-line sm" onClick={() => fileRef.current.click()} disabled={uploading > 0}>
              {uploading > 0 ? `Đang tải lên ${uploading} ảnh…` : '+ Tải ảnh lên'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        <p className="muted">
          Mỗi màu có thể có <b>nhiều ảnh (nhiều góc chụp)</b>: chọn màu ở ô bên trái nút "Tải ảnh lên" rồi chọn nhiều ảnh một lúc, hoặc đổi màu ở ô dưới từng ảnh.
          Khách chọn màu nào thì thấy các ảnh của màu đó, sau đó tới ảnh chung. Ảnh đầu tiên là ảnh đại diện trên trang chủ.
          Nên dùng ảnh nền trắng hoặc trong suốt, tối đa 5MB.
        </p>
        {form.images.length === 0 ? (
          <div className="drop" onClick={() => fileRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            Chưa có ảnh. Kéo thả ảnh vào đây hoặc bấm để chọn. Khi chưa có ảnh, website dùng hình minh hoạ.
          </div>
        ) : (
          <div className="img-grid">
            {form.images.map((img, i) => (
              <figure key={img._k}>
                <img src={cdn(img.url, 300)} alt={`Ảnh ${i + 1}`} />
                {i === 0 && <span className="pill info main-pill">Ảnh đại diện</span>}
                <select aria-label={`Màu của ảnh ${i + 1}`} value={img.color_index ?? ''} onChange={(e) => setRow('images', i, { color_index: e.target.value === '' ? null : Number(e.target.value) })}>
                  <option value="">Ảnh chung</option>
                  {form.colors.map((c, ci) => <option key={c._k} value={ci}>Màu {c.name || ci + 1}</option>)}
                </select>
                <div className="img-actions">
                  <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Đưa lên trước">‹</button>
                  <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Đưa ra sau">›</button>
                  <button type="button" onClick={() => set({ images: form.images.filter((_, j) => j !== i) })} aria-label="Bỏ ảnh">Bỏ</button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* 6. Thông số */}
      <section className="psec">
        <div className="psec-head"><h2>Thông số kỹ thuật</h2><button type="button" className="btn btn-line sm" onClick={() => set({ specs: [...form.specs, { _k: k(), label: '', value: '' }] })}>+ Thêm dòng</button></div>
        <div className="rows">
          {form.specs.length === 0 && <p className="muted">Chưa có thông số. Ví dụ: Màn hình / 6.3 inch.</p>}
          {form.specs.map((s, i) => (
            <div className="row spec" key={s._k}>
              <input aria-label="Tên thông số" value={s.label} onChange={(e) => setRow('specs', i, { label: e.target.value })} placeholder="Màn hình" />
              <input aria-label="Giá trị" value={s.value} onChange={(e) => setRow('specs', i, { value: e.target.value })} placeholder="6.3 inch" />
              <button type="button" className="icon-btn" onClick={() => set({ specs: form.specs.filter((_, j) => j !== i) })} aria-label="Xoá dòng">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Bài viết mô tả */}
      <section className="psec">
        <div className="psec-head">
          <h2>Bài viết mô tả</h2>
          <button type="button" className="btn btn-line sm" onClick={() => set({ sections: [...form.sections, { _k: k(), title: '', body: '', image_url: '' }] })}>+ Thêm đoạn</button>
        </div>
        <p className="muted">Hiện ở mục "Đặc điểm nổi bật" trên trang sản phẩm. Mỗi đoạn gồm tiêu đề, nội dung (xuống dòng để tách đoạn) và một ảnh minh hoạ tuỳ chọn. Ảnh ở đây giữ nguyên khung hình, nên dùng ảnh ngang.</p>
        <input ref={sectionFileRef} type="file" accept="image/*" hidden onChange={(e) => onSectionFile(e.target.files[0])} />
        <div className="sections">
          {form.sections.length === 0 && <p className="muted">Chưa có đoạn nào. Ví dụ: "Màn hình lớn nhất từ trước tới nay" kèm một đoạn giới thiệu và ảnh.</p>}
          {form.sections.map((se, i) => (
            <div className="section-row" key={se._k}>
              <div className="section-fields">
                <input aria-label={`Tiêu đề đoạn ${i + 1}`} value={se.title} maxLength={200} onChange={(e) => setRow('sections', i, { title: e.target.value })} placeholder="Tiêu đề, ví dụ: Chip A20 Pro mạnh mẽ" />
                <textarea aria-label={`Nội dung đoạn ${i + 1}`} value={se.body} maxLength={3000} rows={4} onChange={(e) => setRow('sections', i, { body: e.target.value })} placeholder="Nội dung giới thiệu…" />
              </div>
              <div className="section-img">
                {se.image_url
                  ? <img src={cdn(se.image_url, 300, false)} alt={`Ảnh đoạn ${i + 1}`} />
                  : <span className="muted">Chưa có ảnh</span>}
                <div className="img-actions">
                  <button type="button" disabled={uploading > 0} onClick={() => { setSectionTarget(se._k); sectionFileRef.current.click(); }}>{se.image_url ? 'Đổi ảnh' : 'Thêm ảnh'}</button>
                  {se.image_url && <button type="button" onClick={() => setRow('sections', i, { image_url: '' })}>Bỏ ảnh</button>}
                </div>
              </div>
              <div className="section-actions">
                <button type="button" className="icon-btn" onClick={() => move('sections', i, -1)} disabled={i === 0} aria-label="Đưa lên">↑</button>
                <button type="button" className="icon-btn" onClick={() => move('sections', i, 1)} disabled={i === form.sections.length - 1} aria-label="Đưa xuống">↓</button>
                <button type="button" className="icon-btn" onClick={() => set({ sections: form.sections.filter((_, j) => j !== i) })} aria-label="Xoá đoạn">×</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!isNew && (
        <section className="psec danger">
          <h2>Xoá sản phẩm</h2>
          <p className="muted">Xoá vĩnh viễn sản phẩm cùng phiên bản, màu, tồn kho và ảnh. Đơn hàng cũ vẫn giữ nguyên tên và giá. Nếu chỉ muốn tạm ngừng bán, hãy bỏ chọn "Đang bán".</p>
          {confirmDelete ? (
            <div className="confirm">
              <span>Xoá vĩnh viễn <b>{form.name}</b>?</span>
              <button type="button" className="btn danger-btn" onClick={remove}>Xoá vĩnh viễn</button>
              <button type="button" className="btn btn-line" onClick={() => setConfirmDelete(false)}>Không xoá</button>
            </div>
          ) : (
            <button type="button" className="btn btn-line danger-line" onClick={() => setConfirmDelete(true)}>Xoá sản phẩm…</button>
          )}
        </section>
      )}

      <div className="savebar">
        {status.text && <div className={status.type === 'error' ? 'form-error' : 'form-ok'} role="status">{status.text}</div>}
        <div className="savebar-actions">
          <Link className="btn btn-line" to="/admin">Quay lại</Link>
          <button className="btn btn-primary" disabled={saving || uploading > 0}>{saving ? 'Đang lưu…' : isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi'}</button>
        </div>
      </div>
    </form>
  );
}
