-- =====================================================================
-- DH tech - Cấu trúc database (PostgreSQL)
-- Chạy file này TRƯỚC, sau đó chạy seed.sql để nạp dữ liệu mẫu.
-- Chạy lại nhiều lần được: các bảng cũ sẽ bị xoá và tạo lại từ đầu.
-- =====================================================================

DROP TABLE IF EXISTS order_items, orders, customers, admins,
  product_sections, product_specs, product_images, product_skus,
  product_colors, product_variants, products,
  brands, categories CASCADE;

-- ---------------------------------------------------------------------
-- Danh mục (nhiều cấp): Điện thoại, Phụ kiện > Sạc và cáp, ...
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id   INT REFERENCES categories(id) ON DELETE SET NULL,  -- NULL = danh mục gốc
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Thương hiệu: Apple, Samsung, ...
-- ---------------------------------------------------------------------
CREATE TABLE brands (
  id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- Sản phẩm: thông tin chung, KHÔNG chứa giá (giá nằm ở từng phiên bản)
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id      INT NOT NULL REFERENCES categories(id),
  brand_id         INT REFERENCES brands(id),                 -- phụ kiện không thương hiệu thì để NULL
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(200) NOT NULL UNIQUE,              -- dùng trong đường dẫn: iphone-18-pro-max
  short_desc       VARCHAR(300),
  discount_amount  BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),  -- số tiền DH tech giảm
  gift_text        VARCHAR(300),
  is_hot           BOOLEAN NOT NULL DEFAULT FALSE,            -- hiện ở mục Hot sale
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,             -- ẩn sản phẩm mà không cần xoá
  highlights       TEXT,                                      -- "Thông tin nổi bật", mỗi dòng một ý
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Phiên bản: dung lượng / cấu hình. Mỗi phiên bản có giá niêm yết riêng.
-- ---------------------------------------------------------------------
CREATE TABLE product_variants (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,                          -- "256GB", "12GB · 512GB"
  list_price  BIGINT NOT NULL CHECK (list_price > 0),         -- giá niêm yết (VNĐ)
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, name),
  UNIQUE (id, product_id)          -- để product_skus kiểm tra phiên bản thuộc đúng sản phẩm
);

-- ---------------------------------------------------------------------
-- Màu sắc của sản phẩm
-- ---------------------------------------------------------------------
CREATE TABLE product_colors (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,                          -- "Titan Đen"
  hex         CHAR(7) NOT NULL CHECK (hex ~ '^#[0-9A-Fa-f]{6}$'),  -- mã màu hiển thị: #1C1D20
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, name),
  UNIQUE (id, product_id)
);

-- ---------------------------------------------------------------------
-- SKU = một món hàng cụ thể trong kho = 1 phiên bản + 1 màu.
-- Ví dụ: iPhone 18 Pro 256GB màu Đen. Tồn kho được đếm ở đây.
-- Khoá ngoại kép bảo đảm phiên bản và màu thuộc CÙNG một sản phẩm.
-- ---------------------------------------------------------------------
CREATE TABLE product_skus (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL,
  variant_id  INT NOT NULL,
  color_id    INT NOT NULL,
  sku_code    VARCHAR(80) NOT NULL UNIQUE,                    -- mã quản lý kho
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  FOREIGN KEY (variant_id, product_id) REFERENCES product_variants(id, product_id) ON DELETE CASCADE,
  FOREIGN KEY (color_id,   product_id) REFERENCES product_colors(id, product_id)   ON DELETE CASCADE,
  UNIQUE (variant_id, color_id)    -- mỗi cặp phiên bản + màu chỉ có một SKU
);

-- ---------------------------------------------------------------------
-- Ảnh sản phẩm (đường dẫn trên Cloudinary). color_id NULL = ảnh chung.
-- ---------------------------------------------------------------------
CREATE TABLE product_images (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id    INT REFERENCES product_colors(id) ON DELETE SET NULL,
  url         TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Thông số kỹ thuật: mỗi dòng là một cặp "Nhãn: Giá trị"
-- ---------------------------------------------------------------------
CREATE TABLE product_specs (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_name  VARCHAR(60) NOT NULL DEFAULT 'Thông số chung',   -- nhóm: Màn hình, Camera sau, Pin & Sạc...
  label       VARCHAR(100) NOT NULL,
  value       VARCHAR(300) NOT NULL,
  is_key      BOOLEAN NOT NULL DEFAULT FALSE,                 -- hiện ở ô "Thông số nổi bật"
  sort_order  INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Bài viết mô tả sản phẩm: nhiều đoạn, mỗi đoạn có tiêu đề, nội dung và một ảnh
-- (giống phần "Đặc điểm nổi bật" của các trang bán hàng lớn)
-- ---------------------------------------------------------------------
CREATE TABLE product_sections (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title       VARCHAR(200),
  body        TEXT CHECK (length(body) <= 3000),
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Tài khoản quản trị. Chỉ lưu mật khẩu đã băm (bcrypt), không lưu mật khẩu thật.
-- ---------------------------------------------------------------------
CREATE TABLE admins (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username       VARCHAR(50) NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Tài khoản khách hàng (đăng ký để xem lại đơn hàng)
-- ---------------------------------------------------------------------
CREATE TABLE customers (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(15)  NOT NULL UNIQUE,
  email          VARCHAR(120) UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Đơn hàng
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id    INT REFERENCES customers(id) ON DELETE SET NULL,  -- trống nếu mua không đăng nhập
  customer_name  VARCHAR(100) NOT NULL,
  phone          VARCHAR(15) NOT NULL,
  address        TEXT,
  note           TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','shipping','completed','cancelled')),
  total          BIGINT NOT NULL CHECK (total >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Chi tiết đơn hàng. Lưu lại tên và giá LÚC MUA (snapshot),
-- để đổi giá sản phẩm sau này không làm sai đơn hàng cũ.
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku_id        INT REFERENCES product_skus(id) ON DELETE SET NULL,  -- xoá sản phẩm vẫn giữ lịch sử đơn
  product_name  VARCHAR(200) NOT NULL,
  variant_name  VARCHAR(100) NOT NULL,
  color_name    VARCHAR(100) NOT NULL,
  unit_price    BIGINT NOT NULL CHECK (unit_price >= 0),
  quantity      INT NOT NULL CHECK (quantity > 0)
);

-- ---------------------------------------------------------------------
-- Chỉ mục (index) cho các cột hay dùng để tìm kiếm và nối bảng.
-- PostgreSQL không tự tạo index cho khoá ngoại.
-- ---------------------------------------------------------------------
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_brand     ON products(brand_id);
CREATE INDEX idx_variants_product   ON product_variants(product_id);
CREATE INDEX idx_colors_product     ON product_colors(product_id);
CREATE INDEX idx_skus_product       ON product_skus(product_id);
CREATE INDEX idx_images_product     ON product_images(product_id);
CREATE INDEX idx_specs_product      ON product_specs(product_id);
CREATE INDEX idx_sections_product   ON product_sections(product_id);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_orders_customer    ON orders(customer_id);
