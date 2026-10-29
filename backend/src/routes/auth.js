// Đăng nhập admin
//   POST /api/auth/login   { username, password }  ->  { token, admin }
//   GET  /api/auth/me      kiểm tra token còn dùng được không
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Chống dò mật khẩu: mỗi địa chỉ IP sai quá 5 lần thì khoá 15 phút.
// Lưu trong bộ nhớ, đủ dùng cho một server. Hệ thống lớn sẽ dùng Redis.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map();

// Mã băm giả, dùng khi tên đăng nhập không tồn tại (xem giải thích bên dưới)
const DUMMY_HASH = bcrypt.hashSync('khong-phai-mat-khau-that', 12);

router.post('/login', async (req, res) => {
  const ip = req.ip;
  const record = fails.get(ip);
  if (record && record.count >= MAX_FAILS && Date.now() < record.until) {
    const minutes = Math.ceil((record.until - Date.now()) / 60000);
    return res.status(429).json({ error: `Sai quá nhiều lần. Thử lại sau ${minutes} phút.` });
  }

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Nhập tên đăng nhập và mật khẩu' });
  }

  const { rows } = await pool.query('SELECT id, username, password_hash FROM admins WHERE username = $1', [username.trim()]);
  // Luôn chạy bcrypt.compare kể cả khi không có tài khoản, để kẻ xấu không đoán được
  // tên đăng nhập nào tồn tại dựa vào thời gian phản hồi.
  const hash = rows[0]?.password_hash ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);

  if (!rows[0] || !ok) {
    const r = fails.get(ip) ?? { count: 0, until: 0 };
    r.count = Date.now() > r.until ? 1 : r.count + 1;
    r.until = Date.now() + LOCK_MS;
    fails.set(ip, r);
    // Không nói rõ sai tên hay sai mật khẩu
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }

  fails.delete(ip);
  const admin = { id: rows[0].id, username: rows[0].username };
  const token = jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, admin });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: { id: req.admin.id, username: req.admin.username } });
});

export default router;
