// Tài khoản khách hàng
//   POST /api/account/register  { full_name, phone, email?, password, remember? } -> { token, customer }
//   POST /api/account/login     { login (số điện thoại hoặc email), password, remember? } -> { token, customer }
//   GET  /api/account/me        thông tin tài khoản (cần đăng nhập)
//   GET  /api/account/orders    các đơn hàng của tài khoản (cần đăng nhập)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireCustomer, signCustomer } from '../middleware/auth.js';
import { createLimiter } from '../middleware/rateLimit.js';

const router = Router();

const loginLimiter = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });   // sai 5 lần -> khoá 15 phút
const signupLimiter = createLimiter({ max: 10, windowMs: 60 * 60 * 1000 }); // tối đa 10 tài khoản / giờ / IP
const DUMMY_HASH = bcrypt.hashSync('khong-phai-mat-khau-that', 12);

const PHONE = /^0\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const publicCustomer = (c) => ({ id: c.id, full_name: c.full_name, phone: c.phone, email: c.email, created_at: c.created_at });

router.post('/register', async (req, res) => {
  const ip = req.ip;
  if (signupLimiter.blockedMinutes(ip)) return res.status(429).json({ error: 'Tạo quá nhiều tài khoản. Thử lại sau.' });

  const b = req.body ?? {};
  const name = typeof b.full_name === 'string' ? b.full_name.trim() : '';
  const phone = typeof b.phone === 'string' ? b.phone.replace(/\s/g, '') : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';

  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Họ tên cần từ 2 đến 100 ký tự' });
  if (!PHONE.test(phone)) return res.status(400).json({ error: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' });
  if (email && (email.length > 120 || !EMAIL.test(email))) return res.status(400).json({ error: 'Email không hợp lệ' });
  // bcrypt chỉ dùng 72 byte đầu của mật khẩu, nên giới hạn độ dài
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Mật khẩu cần từ 8 đến 72 ký tự' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows: [c] } = await pool.query(
      `INSERT INTO customers (full_name, phone, email, password_hash) VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, phone, email, created_at`,
      [name, phone, email || null, hash]
    );
    signupLimiter.hit(ip);
    res.status(201).json({ token: signCustomer(c, Boolean(b.remember)), customer: publicCustomer(c) });
  } catch (err) {
    // 23505 = trùng giá trị UNIQUE (số điện thoại hoặc email đã có người dùng)
    if (err.code === '23505') {
      const field = String(err.constraint).includes('email') ? 'Email' : 'Số điện thoại';
      return res.status(409).json({ error: `${field} này đã được đăng ký. Hãy đăng nhập.` });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const ip = req.ip;
  const minutes = loginLimiter.blockedMinutes(ip);
  if (minutes) return res.status(429).json({ error: `Sai quá nhiều lần. Thử lại sau ${minutes} phút.` });

  const { login, password, remember } = req.body ?? {};
  if (typeof login !== 'string' || typeof password !== 'string' || !login.trim() || !password) {
    return res.status(400).json({ error: 'Nhập số điện thoại (hoặc email) và mật khẩu' });
  }
  const key = login.trim().toLowerCase().replace(/\s/g, '');
  const { rows } = await pool.query(
    'SELECT id, full_name, phone, email, password_hash, created_at FROM customers WHERE phone = $1 OR email = $1',
    [key]
  );
  // Luôn so mật khẩu kể cả khi không có tài khoản, để không đoán được số nào đã đăng ký qua thời gian phản hồi
  const ok = await bcrypt.compare(password, rows[0]?.password_hash ?? DUMMY_HASH);
  if (!rows[0] || !ok) {
    loginLimiter.hit(ip);
    return res.status(401).json({ error: 'Số điện thoại/email hoặc mật khẩu không đúng' });
  }
  loginLimiter.reset(ip);
  res.json({ token: signCustomer(rows[0], Boolean(remember)), customer: publicCustomer(rows[0]) });
});

router.get('/me', requireCustomer, async (req, res) => {
  const { rows: [c] } = await pool.query('SELECT id, full_name, phone, email, created_at FROM customers WHERE id = $1', [req.customer.id]);
  if (!c) return res.status(401).json({ error: 'Tài khoản không còn tồn tại' });
  res.json({ customer: publicCustomer(c) });
});

router.get('/orders', requireCustomer, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at, o.address,
            json_agg(json_build_object('name', i.product_name, 'variant', i.variant_name, 'color', i.color_name,
                                       'price', i.unit_price, 'quantity', i.quantity) ORDER BY i.id) AS items
     FROM orders o JOIN order_items i ON i.order_id = o.id
     WHERE o.customer_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [req.customer.id]
  );
  res.json({ items: rows });
});

export default router;
