// Điểm khởi động của backend DH tech
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { requireAdmin } from './middleware/auth.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

// Thiếu khoá ký token thì không cho chạy, tránh lỡ chạy server mà ai cũng giả mạo được admin
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Thiếu JWT_SECRET (cần ít nhất 32 ký tự). Xem hướng dẫn trong .env.example');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Render đứng trước server như một "người gác cổng" (proxy).
// Dòng này giúp đọc đúng địa chỉ IP thật của khách, dùng cho giới hạn đăng nhập sai.
app.set('trust proxy', 1);

// Chỉ cho phép website của mình gọi API.
// CORS_ORIGIN = danh sách địa chỉ, cách nhau dấu phẩy. Để trống = cho phép tất cả (khi chạy trên máy).
// Dấu * thay cho một đoạn bất kỳ, ví dụ https://dh-tech-frontend*.vercel.app cho cả các bản preview.
const allowed = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
  .map((p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]*') + '$'));
app.use(cors(allowed.length ? { origin: (origin, cb) => cb(null, !origin || allowed.some((re) => re.test(origin))) } : {}));
app.use(express.json({ limit: '200kb' }));

app.get('/', (req, res) => {
  res.json({ name: 'DH tech API', docs: '/api/health, /api/products, /api/categories' });
});

app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS db_time');
  res.json({ status: 'ok', db_time: rows[0].db_time });
});

// Ai cũng gọi được
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

// Chỉ admin đã đăng nhập: requireAdmin chặn ở cửa trước khi vào bất kỳ route nào bên trong
app.use('/api/admin', requireAdmin, adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Không có API ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  // JSON gửi lên bị lỗi cú pháp
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Dữ liệu gửi lên không đúng định dạng JSON' });
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

app.listen(PORT, () => {
  console.log(`DH tech API đang chạy tại http://localhost:${PORT}`);
});
