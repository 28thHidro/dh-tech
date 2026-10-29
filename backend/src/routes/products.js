// API sản phẩm
//   GET /api/products          danh sách (có lọc, tìm kiếm, sắp xếp)
//   GET /api/products/:slug    chi tiết một sản phẩm
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Chỉ cho phép các kiểu sắp xếp này. Không bao giờ ghép thẳng dữ liệu người dùng vào câu SQL.
const SORTS = {
  featured:   'p.is_hot DESC, p.id ASC',
  price_asc:  'min_price ASC',
  price_desc: 'min_price DESC',
  newest:     'p.created_at DESC',
};

// GET /api/products?category=phu-kien&brand=apple&q=pro&hot=true&sort=price_asc
router.get('/', async (req, res) => {
  const { category, brand, q, hot, sort = 'featured' } = req.query;

  if (!SORTS[sort]) {
    return res.status(400).json({ error: `sort chỉ nhận: ${Object.keys(SORTS).join(', ')}` });
  }
  if (hot !== undefined && hot !== 'true' && hot !== 'false') {
    return res.status(400).json({ error: 'hot chỉ nhận true hoặc false' });
  }

  // $1, $2... là tham số. Thư viện pg tự xử lý an toàn, chống SQL injection.
  const { rows } = await pool.query(
    `SELECT p.slug, p.name, p.short_desc,
            b.name AS brand, b.slug AS brand_slug,
            c.slug AS category, pc.slug AS parent_category,
            p.discount_amount, p.gift_text, p.is_hot,
            v.min_list_price,
            v.min_list_price - p.discount_amount AS min_price,
            v.variants, col.colors,
            COALESCE(st.total_stock, 0) AS total_stock
     FROM products p
     JOIN categories c       ON c.id = p.category_id
     LEFT JOIN categories pc ON pc.id = c.parent_id
     LEFT JOIN brands b      ON b.id = p.brand_id
     JOIN LATERAL (
       SELECT MIN(list_price) AS min_list_price,
              json_agg(name ORDER BY sort_order) AS variants
       FROM product_variants WHERE product_id = p.id
     ) v ON TRUE
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('name', name, 'hex', hex) ORDER BY sort_order) AS colors
       FROM product_colors WHERE product_id = p.id
     ) col ON TRUE
     LEFT JOIN LATERAL (
       SELECT SUM(stock)::int AS total_stock FROM product_skus WHERE product_id = p.id
     ) st ON TRUE
     WHERE p.is_active
       AND ($1::text IS NULL OR c.slug = $1 OR pc.slug = $1)
       AND ($2::text IS NULL OR b.slug = $2)
       AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.short_desc ILIKE '%' || $3 || '%')
       AND ($4::boolean IS NULL OR p.is_hot = $4)
     ORDER BY ${SORTS[sort]}`,
    [category ?? null, brand ?? null, q?.trim() || null, hot ?? null]
  );

  res.json({ count: rows.length, items: rows });
});

// GET /api/products/iphone-18-pro
router.get('/:slug', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.slug, p.name, p.short_desc,
            b.name AS brand, b.slug AS brand_slug,
            c.name AS category_name, c.slug AS category,
            p.discount_amount, p.gift_text, p.is_hot,
            (SELECT json_agg(json_build_object(
                      'id', v.id, 'name', v.name,
                      'list_price', v.list_price,
                      'price', v.list_price - p.discount_amount)
                    ORDER BY v.sort_order)
             FROM product_variants v WHERE v.product_id = p.id) AS variants,
            (SELECT json_agg(json_build_object('id', co.id, 'name', co.name, 'hex', co.hex)
                    ORDER BY co.sort_order)
             FROM product_colors co WHERE co.product_id = p.id) AS colors,
            (SELECT json_agg(json_build_object(
                      'variant_id', s.variant_id, 'color_id', s.color_id,
                      'sku_code', s.sku_code, 'stock', s.stock))
             FROM product_skus s WHERE s.product_id = p.id) AS skus,
            (SELECT COALESCE(json_agg(json_build_object('label', sp.label, 'value', sp.value)
                    ORDER BY sp.sort_order), '[]'::json)
             FROM product_specs sp WHERE sp.product_id = p.id) AS specs,
            (SELECT COALESCE(json_agg(json_build_object('url', i.url, 'color_id', i.color_id)
                    ORDER BY i.sort_order), '[]'::json)
             FROM product_images i WHERE i.product_id = p.id) AS images
     FROM products p
     JOIN categories c  ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.slug = $1 AND p.is_active`,
    [req.params.slug]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
  }
  res.json(rows[0]);
});

export default router;
