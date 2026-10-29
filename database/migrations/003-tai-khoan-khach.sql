-- =====================================================================
-- Cập nhật database đang chạy (Neon) để khách có tài khoản và xem lại đơn hàng.
-- Chạy file này MỘT LẦN trong SQL Editor của Neon, TRƯỚC khi push code mới.
-- Không xoá dữ liệu cũ. Chạy lại lần nữa cũng không sao.
-- =====================================================================

-- Tài khoản khách hàng. Chỉ lưu mật khẩu đã băm (bcrypt), không lưu mật khẩu thật.
CREATE TABLE IF NOT EXISTS customers (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(15)  NOT NULL UNIQUE,
  email          VARCHAR(120) UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Đơn hàng gắn với tài khoản (để trống nếu khách mua không đăng nhập).
-- Xoá tài khoản thì đơn cũ vẫn còn, chỉ bỏ liên kết.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INT REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Kiểm tra: phải thấy 2 dòng customers và orders.customer_id
SELECT table_name, column_name FROM information_schema.columns
WHERE (table_name = 'customers' AND column_name = 'id') OR (table_name = 'orders' AND column_name = 'customer_id');
