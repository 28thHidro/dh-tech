// Đăng nhập admin
//   POST /api/auth/login   { username, password }  ->  { token, admin }
//   GET  /api/auth/me      kiểm tra token còn dùng được không
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAdmin, signAdmin } from '../middleware/auth.js';
import { createLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Chống dò mật khẩu: mỗi địa chỉ IP sai quá 5 lần thì khoá 15 phút
const limiter = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

// Mã băm giả, dùng khi tên đăng nhập không tồn tại (xem giải thích bên dưới)
const DUMMY_HASH = bcrypt.hashSync('khong-phai-mat-khau-that', 12);

router.post('/login', async (req, res) => {
  const ip = req.ip;
  const minutes = limiter.blockedMinutes(ip);
  if (minutes) return res.status(429).json({ error: `Sai quá nhiều lần. Thử lại sau ${minutes} phút.` });

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
    limiter.hit(ip);
    // Không nói rõ sai tên hay sai mật khẩu
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }

  limiter.reset(ip);
  const admin = { id: rows[0].id, username: rows[0].username };
  const token = signAdmin(admin);
  res.json({ token, admin });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: { id: req.admin.id, username: req.admin.username } });
});

export default router;
