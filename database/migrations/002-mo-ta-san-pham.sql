-- =====================================================================
-- Cập nhật database đang chạy (Neon) để có phần "Mô tả sản phẩm".
-- Chạy file này MỘT LẦN trong SQL Editor của Neon, TRƯỚC khi push code mới.
-- Không xoá dữ liệu cũ. Chạy lại lần nữa cũng không sao (IF NOT EXISTS).
-- =====================================================================

CREATE TABLE IF NOT EXISTS product_sections (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title       VARCHAR(200),
  body        TEXT CHECK (length(body) <= 3000),
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sections_product ON product_sections(product_id);

-- Kiểm tra: phải thấy 1 dòng product_sections
SELECT table_name FROM information_schema.tables WHERE table_name = 'product_sections';
