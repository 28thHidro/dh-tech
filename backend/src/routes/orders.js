// Khách đặt hàng
//   POST /api/orders  { customer_name, phone, address?, note?, items: [{ sku_id, quantity }] }
//
// Giá được tính lại trên server từ database. Không bao giờ tin giá do trình duyệt gửi lên,
// vì ai cũng có thể sửa request để mua iPhone với giá 1.000đ.
import { Router } from 'express';
import { pool } from '../db.js';
import { optionalCustomer } from '../middleware/auth.js';

const router = Router();

// Khách đã đăng nhập thì đơn được gắn vào tài khoản, để xem lại trong trang Tài khoản
router.post('/', optionalCustomer, async (req, res) => {
  const { customer_name, phone, address, note, items } = req.body ?? {};

  // 1. Kiểm tra dữ liệu đầu vào
  const name = typeof customer_name === 'string' ? customer_name.trim() : '';
  const tel = typeof phone === 'string' ? phone.replace(/\s/g, '') : '';
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Họ tên cần từ 2 đến 100 ký tự' });
  if (!/^0\d{9}$/.test(tel)) return res.status(400).json({ error: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' });
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return res.status(400).json({ error: 'Giỏ hàng trống hoặc quá nhiều sản phẩm' });
  }
  const wanted = new Map();
  for (const it of items) {
    const id = Number(it?.sku_id), qty = Number(it?.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({ error: 'Sản phẩm hoặc số lượng không hợp lệ (tối đa 10 mỗi món)' });
    }
    wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }

  // 2. Transaction: hoặc làm trọn mọi bước, hoặc không làm gì cả.
  //    Tránh trường hợp đã tạo đơn nhưng chưa trừ kho, hoặc ngược lại.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE khoá các dòng SKU này cho tới khi xong đơn.
    // Hai người cùng mua chiếc cuối cùng thì người sau phải chờ, và sẽ thấy hết hàng.
    const { rows: skus } = await client.query(
      `SELECT s.id, s.stock, p.name AS product_name, p.is_active,
              v.name AS variant_name, c.name AS color_name,
              v.list_price - p.discount_amount AS price
       FROM product_skus s
       JOIN products p         ON p.id = s.product_id
       JOIN product_variants v ON v.id = s.variant_id
       JOIN product_colors c   ON c.id = s.color_id
       WHERE s.id = ANY($1::int[])
       FOR UPDATE OF s`,
      [[...wanted.keys()]]
    );

    if (skus.length !== wanted.size) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Có sản phẩm trong giỏ không còn bán. Hãy xoá giỏ và chọn lại.' });
    }
    for (const s of skus) {
      const qty = wanted.get(s.id);
      if (!s.is_active || s.stock < qty) {
        await client.query('ROLLBACK');
        const left = !s.is_active ? 'đã ngừng bán' : s.stock === 0 ? 'vừa hết hàng' : `chỉ còn ${s.stock} máy`;
        return res.status(409).json({ error: `${s.product_name} ${s.variant_name} ${s.color_name} ${left}.` });
      }
    }

    const total = skus.reduce((sum, s) => sum + s.price * wanted.get(s.id), 0);
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (customer_id, customer_name, phone, address, note, total)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [req.customer?.id ?? null, name, tel, address?.toString().slice(0, 300) || null, note?.toString().slice(0, 300) || null, total]
    );

    for (const s of skus) {
      const qty = wanted.get(s.id);
      await client.query(
        `INSERT INTO order_items (order_id, sku_id, product_name, variant_name, color_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, s.id, s.product_name, s.variant_name, s.color_name, s.price, qty]
      );
      await client.query('UPDATE product_skus SET stock = stock - $1 WHERE id = $2', [qty, s.id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: order.id, total, created_at: order.created_at });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
