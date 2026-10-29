// API quản trị. Mọi đường dẫn ở đây đều cần đăng nhập (requireAdmin gắn trong server.js).
//   GET    /api/admin/meta                 danh mục + thương hiệu cho ô chọn
//   GET    /api/admin/products             tất cả sản phẩm, kể cả đang ẩn
//   GET    /api/admin/products/:id         chi tiết để sửa
//   POST   /api/admin/products             thêm sản phẩm
//   PUT    /api/admin/products/:id         sửa sản phẩm
//   DELETE /api/admin/products/:id         xoá sản phẩm
//   GET    /api/admin/orders               danh sách đơn hàng
//   PATCH  /api/admin/orders/:id           đổi trạng thái đơn
//   POST   /api/admin/upload-signature     chữ ký để trình duyệt upload ảnh thẳng lên Cloudinary
import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';

const router = Router();

// ---------------------------------------------------------------------
// Danh mục và thương hiệu
// ---------------------------------------------------------------------
router.get('/meta', async (req, res) => {
  const [cats, brands] = await Promise.all([
    pool.query(`SELECT c.id, c.name, c.slug, p.name AS parent_name
                FROM categories c LEFT JOIN categories p ON p.id = c.parent_id
                ORDER BY COALESCE(p.sort_order, c.sort_order), c.parent_id NULLS FIRST, c.sort_order`),
    pool.query('SELECT id, name, slug FROM brands ORDER BY name'),
  ]);
  res.json({ categories: cats.rows, brands: brands.rows });
});

// ---------------------------------------------------------------------
// Danh sách sản phẩm cho admin
// ---------------------------------------------------------------------
router.get('/products', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.slug, p.name, p.is_active, p.is_hot, p.discount_amount, p.updated_at,
            c.name AS category_name, b.name AS brand,
            (SELECT MIN(list_price) FROM product_variants WHERE product_id = p.id) AS min_list_price,
            (SELECT COALESCE(SUM(stock), 0)::int FROM product_skus WHERE product_id = p.id) AS total_stock,
            (SELECT COUNT(*)::int FROM product_skus WHERE product_id = p.id AND stock = 0) AS out_of_stock_skus,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY color_id NULLS FIRST, sort_order LIMIT 1) AS image,
            (SELECT hex FROM product_colors WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS hex,
            c.slug AS category, b.slug AS brand_slug
     FROM products p
     JOIN categories c  ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     ORDER BY p.updated_at DESC`
  );
  res.json({ items: rows });
});

// ---------------------------------------------------------------------
// Chi tiết một sản phẩm để sửa
// ---------------------------------------------------------------------
router.get('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Mã sản phẩm không hợp lệ' });

  const { rows: [p] } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const [variants, colors, skus, specs, images] = await Promise.all([
    pool.query('SELECT id, name, list_price FROM product_variants WHERE product_id = $1 ORDER BY sort_order, id', [id]),
    pool.query('SELECT id, name, hex FROM product_colors WHERE product_id = $1 ORDER BY sort_order, id', [id]),
    pool.query('SELECT variant_id, color_id, stock FROM product_skus WHERE product_id = $1', [id]),
    pool.query('SELECT label, value FROM product_specs WHERE product_id = $1 ORDER BY sort_order, id', [id]),
    pool.query('SELECT url, color_id FROM product_images WHERE product_id = $1 ORDER BY sort_order, id', [id]),
  ]);

  // Tồn kho dạng bảng: stock[vị trí phiên bản][vị trí màu]
  const stockOf = new Map(skus.rows.map((s) => [`${s.variant_id}-${s.color_id}`, s.stock]));
  const stock = variants.rows.map((v) => colors.rows.map((c) => stockOf.get(`${v.id}-${c.id}`) ?? 0));
  const colorIndex = new Map(colors.rows.map((c, i) => [c.id, i]));

  res.json({
    ...p,
    variants: variants.rows,
    colors: colors.rows,
    stock,
    specs: specs.rows,
    images: images.rows.map((i) => ({ url: i.url, color_index: i.color_id == null ? null : colorIndex.get(i.color_id) ?? null })),
  });
});

// ---------------------------------------------------------------------
// Kiểm tra dữ liệu gửi lên khi thêm/sửa
// ---------------------------------------------------------------------
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function validate(body) {
  const b = body ?? {};
  const errors = [];
  const out = {
    category_id: Number(b.category_id),
    brand_id: b.brand_id ? Number(b.brand_id) : null,
    name: str(b.name, 200),
    slug: str(b.slug, 200).toLowerCase(),
    short_desc: str(b.short_desc, 300) || null,
    discount_amount: Number(b.discount_amount) || 0,
    gift_text: str(b.gift_text, 300) || null,
    is_hot: Boolean(b.is_hot),
    is_active: b.is_active !== false,
    variants: Array.isArray(b.variants) ? b.variants : [],
    colors: Array.isArray(b.colors) ? b.colors : [],
    stock: Array.isArray(b.stock) ? b.stock : [],
    specs: Array.isArray(b.specs) ? b.specs : [],
    images: Array.isArray(b.images) ? b.images : [],
  };

  if (!Number.isInteger(out.category_id)) errors.push('Chọn danh mục');
  if (out.name.length < 2) errors.push('Tên sản phẩm cần ít nhất 2 ký tự');
  if (!SLUG.test(out.slug)) errors.push('Đường dẫn (slug) chỉ gồm chữ thường không dấu, số và dấu gạch ngang, ví dụ iphone-18-pro');
  if (!Number.isInteger(out.discount_amount) || out.discount_amount < 0) errors.push('Số tiền giảm phải là số nguyên không âm');

  if (out.variants.length === 0) errors.push('Cần ít nhất 1 phiên bản');
  out.variants = out.variants.map((v, i) => {
    const name = str(v?.name, 100), price = Number(v?.list_price);
    if (!name) errors.push(`Phiên bản ${i + 1}: thiếu tên`);
    if (!Number.isInteger(price) || price <= 0) errors.push(`Phiên bản ${i + 1}: giá niêm yết phải là số nguyên dương`);
    else if (price <= out.discount_amount) errors.push(`Phiên bản ${i + 1}: giá niêm yết phải lớn hơn số tiền giảm`);
    return { id: Number.isInteger(v?.id) ? v.id : null, name, list_price: price };
  });

  if (out.colors.length === 0) errors.push('Cần ít nhất 1 màu');
  out.colors = out.colors.map((c, i) => {
    const name = str(c?.name, 100), hex = str(c?.hex, 7);
    if (!name) errors.push(`Màu ${i + 1}: thiếu tên`);
    if (!HEX.test(hex)) errors.push(`Màu ${i + 1}: mã màu phải có dạng #1C1D20`);
    return { id: Number.isInteger(c?.id) ? c.id : null, name, hex };
  });

  const dup = (arr) => arr.length !== new Set(arr.map((x) => x.name.toLowerCase())).size;
  if (dup(out.variants)) errors.push('Có hai phiên bản trùng tên');
  if (dup(out.colors)) errors.push('Có hai màu trùng tên');

  out.stock = out.variants.map((_, vi) => out.colors.map((_, ci) => {
    const n = Number(out.stock?.[vi]?.[ci] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 100000) errors.push('Tồn kho phải là số nguyên từ 0');
    return n;
  }));

  out.specs = out.specs
    .map((s) => ({ label: str(s?.label, 100), value: str(s?.value, 300) }))
    .filter((s) => s.label && s.value);

  out.images = out.images.map((img) => {
    const url = str(img?.url, 500);
    if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) errors.push('Ảnh phải được upload qua Cloudinary');
    const ci = img?.color_index;
    return { url, color_index: Number.isInteger(ci) && ci >= 0 && ci < out.colors.length ? ci : null };
  });

  return { data: out, errors: [...new Set(errors)] };
}

// ---------------------------------------------------------------------
// Lưu sản phẩm (dùng chung cho thêm mới và sửa), chạy trong một transaction
// ---------------------------------------------------------------------
async function saveProduct(client, id, d) {
  const fields = [d.category_id, d.brand_id, d.name, d.slug, d.short_desc, d.discount_amount, d.gift_text, d.is_hot, d.is_active];
  if (id) {
    const r = await client.query(
      `UPDATE products SET category_id=$1, brand_id=$2, name=$3, slug=$4, short_desc=$5,
              discount_amount=$6, gift_text=$7, is_hot=$8, is_active=$9, updated_at=now()
       WHERE id=$10`, [...fields, id]);
    if (r.rowCount === 0) return null;
  } else {
    const r = await client.query(
      `INSERT INTO products (category_id, brand_id, name, slug, short_desc, discount_amount, gift_text, is_hot, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, fields);
    id = r.rows[0].id;
  }

  // Phiên bản và màu: có id thì cập nhật, chưa có thì thêm; cái nào bị bỏ khỏi form thì xoá.
  // Giữ nguyên id cũ để không làm hỏng liên kết tồn kho và đơn hàng.
  const upsert = async (table, rows, cols) => {
    const ids = [];
    for (const [i, row] of rows.entries()) {
      const values = cols.map((c) => row[c]);
      if (row.id) {
        const r = await client.query(
          `UPDATE ${table} SET ${cols.map((c, k) => `${c}=$${k + 1}`).join(', ')}, sort_order=$${cols.length + 1}
           WHERE id=$${cols.length + 2} AND product_id=$${cols.length + 3} RETURNING id`,
          [...values, i + 1, row.id, id]);
        if (r.rows[0]) { ids.push(r.rows[0].id); continue; }
      }
      const r = await client.query(
        `INSERT INTO ${table} (product_id, ${cols.join(', ')}, sort_order)
         VALUES ($1, ${cols.map((_, k) => `$${k + 2}`).join(', ')}, $${cols.length + 2}) RETURNING id`,
        [id, ...values, i + 1]);
      ids.push(r.rows[0].id);
    }
    await client.query(`DELETE FROM ${table} WHERE product_id=$1 AND NOT (id = ANY($2::int[]))`, [id, ids]);
    return ids;
  };

  // Tạm đổi tên để không vướng ràng buộc "không trùng tên" khi người dùng hoán đổi tên hai dòng
  await client.query(`UPDATE product_variants SET name = '~' || id WHERE product_id=$1`, [id]);
  await client.query(`UPDATE product_colors SET name = '~' || id WHERE product_id=$1`, [id]);
  const variantIds = await upsert('product_variants', d.variants, ['name', 'list_price']);
  const colorIds = await upsert('product_colors', d.colors, ['name', 'hex']);

  // SKU: mọi tổ hợp phiên bản x màu, kèm tồn kho
  for (const [vi, vId] of variantIds.entries()) {
    for (const [ci, cId] of colorIds.entries()) {
      await client.query(
        `INSERT INTO product_skus (product_id, variant_id, color_id, sku_code, stock)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (variant_id, color_id) DO UPDATE SET stock = EXCLUDED.stock`,
        [id, vId, cId, `${d.slug.toUpperCase()}-${vId}-${cId}`, d.stock[vi][ci]]);
    }
  }

  // Thông số và ảnh không bị bảng nào khác trỏ tới, nên xoá hết rồi ghi lại cho gọn
  await client.query('DELETE FROM product_specs WHERE product_id=$1', [id]);
  for (const [i, s] of d.specs.entries()) {
    await client.query('INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1,$2,$3,$4)', [id, s.label, s.value, i + 1]);
  }
  await client.query('DELETE FROM product_images WHERE product_id=$1', [id]);
  for (const [i, img] of d.images.entries()) {
    await client.query('INSERT INTO product_images (product_id, color_id, url, sort_order) VALUES ($1,$2,$3,$4)',
      [id, img.color_index == null ? null : colorIds[img.color_index], img.url, i + 1]);
  }
  return id;
}

async function handleSave(req, res, id) {
  const { data, errors } = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('. '), errors });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const savedId = await saveProduct(client, id, data);
    if (!savedId) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Không tìm thấy sản phẩm' }); }
    await client.query('COMMIT');
    res.status(id ? 200 : 201).json({ id: savedId, slug: data.slug });
  } catch (err) {
    await client.query('ROLLBACK');
    // 23505 = vi phạm ràng buộc UNIQUE
    if (err.code === '23505') return res.status(409).json({ error: 'Đường dẫn (slug) này đã có sản phẩm khác dùng. Hãy đặt slug khác.' });
    // 23503 = khoá ngoại không tồn tại
    if (err.code === '23503') return res.status(400).json({ error: 'Danh mục hoặc thương hiệu không tồn tại' });
    throw err;
  } finally {
    client.release();
  }
}

router.post('/products', (req, res) => handleSave(req, res, null));

router.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Mã sản phẩm không hợp lệ' });
  return handleSave(req, res, id);
});

router.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Mã sản phẩm không hợp lệ' });
  // Xoá sản phẩm sẽ tự xoá phiên bản, màu, SKU, ảnh, thông số (ON DELETE CASCADE).
  // Đơn hàng cũ vẫn giữ nguyên tên và giá nhờ đã lưu bản chụp (snapshot).
  const r = await pool.query('DELETE FROM products WHERE id = $1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
  res.status(204).end();
});

// ---------------------------------------------------------------------
// Đơn hàng
// ---------------------------------------------------------------------
router.get('/orders', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*,
            (SELECT json_agg(json_build_object(
                      'product_name', i.product_name, 'variant_name', i.variant_name,
                      'color_name', i.color_name, 'unit_price', i.unit_price, 'quantity', i.quantity)
                    ORDER BY i.id)
             FROM order_items i WHERE i.order_id = o.id) AS items
     FROM orders o ORDER BY o.created_at DESC LIMIT 200`
  );
  res.json({ items: rows });
});

const STATUSES = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

router.patch('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [order] } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!order) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Không tìm thấy đơn hàng' }); }
    if (order.status === 'cancelled' && status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Đơn đã huỷ thì không mở lại được. Hãy tạo đơn mới.' });
    }
    // Huỷ đơn thì trả hàng về kho
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await client.query(
        `UPDATE product_skus s SET stock = s.stock + i.quantity
         FROM order_items i WHERE i.order_id = $1 AND i.sku_id = s.id`, [id]);
    }
    await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    await client.query('COMMIT');
    res.json({ id, status });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------
// Upload ảnh: trình duyệt gửi ảnh THẲNG lên Cloudinary, không đi qua server mình
// (đỡ tốn băng thông Render). Server chỉ ký tên xác nhận "admin này được phép upload".
// API Secret nằm trên server, không bao giờ gửi xuống trình duyệt.
// ---------------------------------------------------------------------
router.post('/upload-signature', (req, res) => {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloudName || !apiKey || !secret) {
    return res.status(503).json({ error: 'Chưa cấu hình Cloudinary trên server (thiếu biến CLOUDINARY_...)' });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'dh-tech/products';
  // Cloudinary quy định: sắp xếp tham số theo bảng chữ cái, nối bằng &, thêm secret, băm SHA-1
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');
  res.json({ cloudName, apiKey, timestamp, folder, signature });
});

export default router;
