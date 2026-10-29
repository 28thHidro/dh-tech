// API danh mục
//   GET /api/categories   cây danh mục: Điện thoại, Phụ kiện > Sạc và cáp, ...
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, parent_id, name, slug FROM categories ORDER BY sort_order, id'
  );

  // Dựng cây: danh mục gốc (parent_id = null) chứa các danh mục con
  const roots = rows
    .filter((c) => c.parent_id === null)
    .map(({ id, name, slug }) => ({
      name,
      slug,
      children: rows
        .filter((child) => child.parent_id === id)
        .map(({ name, slug }) => ({ name, slug })),
    }));

  res.json(roots);
});

export default router;
