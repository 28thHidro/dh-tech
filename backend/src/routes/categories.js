// API danh mục
//   GET /api/categories   cây danh mục: Điện thoại, Phụ kiện > Sạc và cáp, ...
//   Mỗi danh mục gốc kèm danh sách hãng đang có hàng trong đó (dùng cho menu lớn)
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const [{ rows }, { rows: brandRows }] = await Promise.all([
    pool.query('SELECT id, parent_id, name, slug FROM categories ORDER BY sort_order, id'),
    // Hãng theo danh mục gốc, hãng nhiều sản phẩm đứng trước
    pool.query(
      `SELECT COALESCE(c.parent_id, c.id) AS root_id, b.name, b.slug, count(*)::int AS count
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE p.is_active
       GROUP BY root_id, b.name, b.slug
       ORDER BY count DESC, b.name`
    ),
  ]);

  // Dựng cây: danh mục gốc (parent_id = null) chứa các danh mục con
  const roots = rows
    .filter((c) => c.parent_id === null)
    .map(({ id, name, slug }) => ({
      name,
      slug,
      brands: brandRows.filter((b) => b.root_id === id).map(({ name, slug, count }) => ({ name, slug, count })),
      children: rows
        .filter((child) => child.parent_id === id)
        .map(({ name, slug }) => ({ name, slug })),
    }));

  res.json(roots);
});

export default router;
