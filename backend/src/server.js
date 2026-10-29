// Điểm khởi động của backend DH tech
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Cho phép website (chạy ở địa chỉ khác) gọi được API này.
// Bước 6 sẽ giới hạn lại chỉ cho phép đúng tên miền của DH tech.
app.use(cors());
app.use(express.json());

// Trang chào, để biết server đang chạy
app.get('/', (req, res) => {
  res.json({ name: 'DH tech API', docs: '/api/health, /api/products, /api/categories' });
});

// Kiểm tra server và database còn sống không
app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS db_time');
  res.json({ status: 'ok', db_time: rows[0].db_time });
});

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);

// Đường dẫn không tồn tại
app.use((req, res) => {
  res.status(404).json({ error: `Không có API ${req.method} ${req.path}` });
});

// Bắt mọi lỗi chưa xử lý: ghi log cho mình đọc, trả thông báo gọn cho người dùng
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

app.listen(PORT, () => {
  console.log(`DH tech API đang chạy tại http://localhost:${PORT}`);
});
