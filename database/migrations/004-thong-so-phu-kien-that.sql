-- =====================================================================
-- DH tech - Cập nhật 004
--   1. Thông số kỹ thuật chia theo NHÓM (Màn hình, Camera, Pin...) và đánh dấu THÔNG SỐ NỔI BẬT
--   2. "Thông tin nổi bật" (các gạch đầu dòng) cho từng sản phẩm
--   3. Sắp lại danh mục: thêm Đồng hồ thông minh, Âm thanh, Gaming gear
--   4. XOÁ phụ kiện mẫu không thương hiệu, thay bằng hàng chính hãng có thông số đầy đủ
--   5. Thông số chi tiết theo nhóm cho iPhone 18 Pro Max, iPhone 18 Pro, iPhone Duo,
--      Galaxy S26 Ultra, MacBook Air 13 inch M5
--
-- Chạy MỘT LẦN trong SQL Editor của Neon, TRƯỚC khi push code mới. Chạy lại nhiều lần vẫn an toàn.
--
-- Nguồn (tham khảo ngày 29/10/2026):
--   Giá Apple Watch, Sony WH-1000XM6, JBL Flip 7, AirPods 4, tay cầm DualSense, củ sạc, cáp,
--   pin Anker Zolo: CellphoneS. AirPods Pro 3: Viettel Store (giá mở bán).
--   Attack Shark K86: shop chính hãng trên Shopee (tổng hợp BigGo). Attack Shark X3: KICAP.
--   Thông số: Apple, Sforum (CellphoneS), Chợ Tốt (Galaxy S26 Ultra), Xiaomi Việt Nam, attackshark.com.
--   Pin Xiaomi 33W: Xiaomi Việt Nam không ghi giá -> giá DH tech tự đặt, cần kiểm tra lại.
--   Apple Watch Ultra 3: thông số theo công bố của Apple tháng 9/2025.
--   iPhone 18 Pro: camera ghi chung "hệ thống 48MP Fusion"; chưa có số liệu pin chính thức.
-- Giá thay đổi theo thời điểm: kiểm tra và sửa trong trang Admin trước khi bán thật.
-- Màu của Apple Watch Series 12 là màu tạm, cần cập nhật theo hàng thực tế.
-- =====================================================================

-- ---------- 1. Cột mới ----------
ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS group_name VARCHAR(60) NOT NULL DEFAULT 'Thông số chung';
ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS is_key BOOLEAN NOT NULL DEFAULT FALSE;  -- hiện ở "Thông số nổi bật"
ALTER TABLE products      ADD COLUMN IF NOT EXISTS highlights TEXT;                         -- mỗi dòng một ý

-- ---------- 2. Danh mục ----------
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Đồng hồ thông minh', 'dong-ho',  3),
  ('Âm thanh',           'am-thanh', 4),
  ('Gaming gear',        'gaming',   5)
ON CONFLICT (slug) DO NOTHING;
UPDATE categories SET sort_order = 6 WHERE slug = 'phu-kien';

-- Tai nghe và loa chuyển sang nhóm Âm thanh
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE slug = 'am-thanh'), sort_order = 1 WHERE slug = 'tai-nghe';
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE slug = 'am-thanh'), sort_order = 2 WHERE slug = 'loa';

INSERT INTO categories (parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.ord
FROM categories c
JOIN (VALUES
  ('gaming', 'Bàn phím cơ',         'ban-phim-co', 1),
  ('gaming', 'Chuột gaming',        'chuot-gaming', 2),
  ('gaming', 'Tay cầm chơi game',   'tay-cam',      3)
) AS v(parent, name, slug, ord) ON c.slug = v.parent
ON CONFLICT (slug) DO NOTHING;

-- ---------- 3. Thương hiệu ----------
INSERT INTO brands (name, slug)
SELECT v.name, v.slug FROM (VALUES
  ('Sony','sony'), ('JBL','jbl'), ('Anker','anker'), ('Ugreen','ugreen'),
  ('Attack Shark','attack-shark'), ('Xiaomi','xiaomi')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.slug = v.slug);

-- ---------- 4. Xoá phụ kiện mẫu KHÔNG thương hiệu ----------
-- Đơn hàng cũ vẫn giữ nguyên tên và giá (order_items lưu bản chụp lúc đặt).
DELETE FROM products p
USING categories c
WHERE p.category_id = c.id
  AND p.brand_id IS NULL
  AND (c.slug IN ('phu-kien','am-thanh') OR c.parent_id IN (SELECT id FROM categories WHERE slug IN ('phu-kien','am-thanh')));

-- Danh mục con phụ kiện không còn sản phẩm nào thì xoá cho menu gọn
DELETE FROM categories c
WHERE c.slug IN ('op-lung','kinh','balo-tui','hub-gia-do','chuot-ban-phim')
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id);

-- ---------- 5. Hàm phụ (chỉ tồn tại trong lần chạy này) ----------
-- Thêm một sản phẩm kèm phiên bản, màu, tồn kho từng SKU, thông số và thông tin nổi bật.
-- Sản phẩm đã có (trùng slug) thì bỏ qua, không ghi đè chỉnh sửa trong Admin.
CREATE OR REPLACE FUNCTION pg_temp.add_product(
  p_cat TEXT, p_brand TEXT, p_name TEXT, p_slug TEXT, p_short TEXT,
  p_discount BIGINT, p_gift TEXT, p_hot BOOLEAN,
  p_variants JSONB,   -- [["Tên phiên bản", giá niêm yết], ...]
  p_colors JSONB,     -- [["Tên màu", "#hex"], ...]
  p_specs JSONB,      -- [["Nhóm", "Tên thông số", "Giá trị", nổi bật?], ...]
  p_highlights JSONB  -- ["ý 1", "ý 2", ...]
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  pid INT; v JSONB; c JSONB; s JSONB; i INT;
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE slug = p_slug) THEN RETURN; END IF;

  INSERT INTO products (category_id, brand_id, name, slug, short_desc, discount_amount, gift_text, is_hot, highlights)
  VALUES ((SELECT id FROM categories WHERE slug = p_cat), (SELECT id FROM brands WHERE slug = p_brand),
          p_name, p_slug, p_short, p_discount, p_gift, p_hot,
          (SELECT string_agg(x, E'\n') FROM jsonb_array_elements_text(p_highlights) AS x))
  RETURNING id INTO pid;

  i := 0;
  FOR v IN SELECT * FROM jsonb_array_elements(p_variants) LOOP
    i := i + 1;
    INSERT INTO product_variants (product_id, name, list_price, sort_order) VALUES (pid, v->>0, (v->>1)::BIGINT, i);
  END LOOP;

  i := 0;
  FOR c IN SELECT * FROM jsonb_array_elements(p_colors) LOOP
    i := i + 1;
    INSERT INTO product_colors (product_id, name, hex, sort_order) VALUES (pid, c->>0, c->>1, i);
  END LOOP;

  -- Mỗi cặp phiên bản x màu là một SKU, tồn kho mẫu từ 3 đến 14
  INSERT INTO product_skus (product_id, variant_id, color_id, sku_code, stock)
  SELECT pid, pv.id, pc.id, upper(p_slug) || '-' || pv.id || '-' || pc.id, 3 + abs(hashtext(p_slug || pv.name || pc.name)) % 12
  FROM product_variants pv CROSS JOIN product_colors pc
  WHERE pv.product_id = pid AND pc.product_id = pid;

  PERFORM pg_temp.set_specs(p_slug, p_specs, NULL);
END $$;

-- Ghi đè toàn bộ thông số (và thông tin nổi bật nếu có) của một sản phẩm đã có
CREATE OR REPLACE FUNCTION pg_temp.set_specs(p_slug TEXT, p_specs JSONB, p_highlights JSONB)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE pid INT; s JSONB; i INT := 0;
BEGIN
  SELECT id INTO pid FROM products WHERE slug = p_slug;
  IF pid IS NULL THEN RETURN; END IF;
  DELETE FROM product_specs WHERE product_id = pid;
  FOR s IN SELECT * FROM jsonb_array_elements(p_specs) LOOP
    i := i + 1;
    INSERT INTO product_specs (product_id, group_name, label, value, is_key, sort_order)
    VALUES (pid, s->>0, s->>1, s->>2, COALESCE((s->>3)::BOOLEAN, FALSE), i);
  END LOOP;
  IF p_highlights IS NOT NULL THEN
    UPDATE products SET highlights = (SELECT string_agg(x, E'\n') FROM jsonb_array_elements_text(p_highlights) AS x), updated_at = now()
    WHERE id = pid;
  END IF;
END $$;

-- ---------- 6. Thông số chi tiết cho sản phẩm chủ lực ----------
SELECT pg_temp.set_specs('iphone-18-pro-max', '[
  ["Cấu hình & Bộ nhớ","Chip","Apple A20 Pro, tiến trình 2nm",true],
  ["Cấu hình & Bộ nhớ","CPU","6 lõi",false],
  ["Cấu hình & Bộ nhớ","GPU","7 lõi",false],
  ["Cấu hình & Bộ nhớ","Neural Engine","16 lõi",false],
  ["Cấu hình & Bộ nhớ","Bộ nhớ trong","256GB / 512GB / 1TB / 2TB",true],
  ["Màn hình","Kích thước","6,9 inch",true],
  ["Màn hình","Công nghệ","Super Retina XDR OLED",false],
  ["Màn hình","Độ phân giải","2868 x 1320 pixels, 460 ppi",false],
  ["Màn hình","Tần số quét","ProMotion tối đa 120Hz",true],
  ["Màn hình","Độ sáng","3.000 nit ngoài trời",false],
  ["Màn hình","Tính năng","Màn hình Luôn Bật, lớp phủ chống phản chiếu",false],
  ["Camera sau","Camera chính","Fusion 48MP, khẩu độ thay đổi ƒ/1.48 đến ƒ/4.0",true],
  ["Camera sau","Camera góc siêu rộng","Fusion 48MP, ƒ/2.2",false],
  ["Camera sau","Camera tele","Fusion 48MP, zoom 4x",false],
  ["Camera sau","Zoom","Quang học tương đương 8x, kỹ thuật số đến 40x",false],
  ["Camera sau","Quay video","4K Dolby Vision đến 120 fps, ProRes, Apple Log 2",false],
  ["Camera sau","Cảm biến khác","LiDAR Scanner",false],
  ["Camera trước","Camera trước","18MP Center Stage",false],
  ["Pin & Sạc","Thời lượng","Xem video đến 43 giờ",true],
  ["Pin & Sạc","Sạc nhanh có dây","50% trong khoảng 15 phút (bộ sạc từ 60W)",false],
  ["Pin & Sạc","Sạc không dây","MagSafe tối đa 25W",false],
  ["Thiết kế","Chất liệu","Khung nhôm, mặt kính Ceramic Shield",false],
  ["Thiết kế","Kích thước","163,4 x 78,0 x 8,75 mm",false],
  ["Thiết kế","Trọng lượng","249 g",false],
  ["Thiết kế","Kháng nước, bụi","IP68 (sâu 6 m trong 30 phút)",false],
  ["Kết nối","Mạng di động","5G",false],
  ["Kết nối","Wi-Fi","Wi-Fi 7",false],
  ["Kết nối","Bluetooth","Bluetooth 6",false],
  ["Kết nối","Cổng","USB-C, chuẩn USB 3 (10Gb/s)",false],
  ["Kết nối","Bảo mật","Face ID",false]
]', '["Chip A20 Pro tiến trình 2nm, GPU 7 lõi","Ba camera 48MP Fusion, camera chính khẩu độ thay đổi ƒ/1.48 đến ƒ/4.0","Zoom quang học tương đương 8x, quay 4K Dolby Vision 120 fps","Pin xem video đến 43 giờ, sạc nhanh 50% trong khoảng 15 phút","Màn hình 6,9 inch ProMotion 120Hz, sáng 3.000 nit ngoài trời"]');

SELECT pg_temp.set_specs('iphone-18-pro', '[
  ["Cấu hình & Bộ nhớ","Hệ điều hành","iOS 27",false],
  ["Cấu hình & Bộ nhớ","Chip","Apple A20 Pro",true],
  ["Cấu hình & Bộ nhớ","CPU","6 lõi (2 lõi hiệu năng, 4 lõi tiết kiệm điện)",false],
  ["Cấu hình & Bộ nhớ","GPU","7 lõi",false],
  ["Cấu hình & Bộ nhớ","Bộ nhớ trong","256GB / 512GB / 1TB / 2TB",true],
  ["Màn hình","Kích thước","6,3 inch",true],
  ["Màn hình","Công nghệ","Super Retina XDR",false],
  ["Màn hình","Độ phân giải","2622 x 1206 pixels",false],
  ["Màn hình","Tần số quét","ProMotion 120Hz",true],
  ["Màn hình","Độ sáng","Tối đa 3.000 nit ngoài trời, 1.600 nit HDR, tối thiểu 1 nit",false],
  ["Màn hình","Tính năng","Dynamic Island, Luôn Bật, HDR, True Tone, dải màu rộng P3, Haptic Touch",false],
  ["Camera sau","Hệ thống camera","Hệ thống camera Pro 48MP Fusion",true],
  ["Camera trước","Camera trước","18MP Center Stage",false],
  ["Thiết kế","Kích thước","150 x 71,9 x 8,75 mm",false],
  ["Thiết kế","Trọng lượng","211 g",false]
]', '["Chip A20 Pro mạnh mẽ trong thân máy 6,3 inch gọn gàng","Màn hình ProMotion 120Hz, sáng đến 3.000 nit ngoài trời","Hệ thống camera Pro 48MP Fusion, camera trước 18MP Center Stage","Nặng 211 g, dễ dùng một tay"]');

SELECT pg_temp.set_specs('iphone-duo', '[
  ["Cấu hình & Bộ nhớ","Hệ điều hành","iOS 27",false],
  ["Cấu hình & Bộ nhớ","Chip","Apple A20 Pro, CPU 6 lõi, GPU 7 lõi",true],
  ["Cấu hình & Bộ nhớ","Đồ hoạ","Dò tia bằng phần cứng",false],
  ["Cấu hình & Bộ nhớ","Tản nhiệt","Buồng hơi",false],
  ["Cấu hình & Bộ nhớ","Bộ nhớ trong","256GB / 512GB / 1TB / 2TB",true],
  ["Màn hình","Màn hình trong","7,6 inch OLED gập, 1878 x 2670 pixels",true],
  ["Màn hình","Tần số quét","ProMotion đến 120Hz",false],
  ["Màn hình","Độ sáng tối đa","3.000 nit",false],
  ["Màn hình","Màn hình ngoài","5,4 inch OLED",true],
  ["Camera sau","Camera chính","48MP Fusion",false],
  ["Camera sau","Camera tele","12MP, zoom quang học 2x",false],
  ["Camera trước","Camera trước","12MP Center Stage",false],
  ["Pin & Sạc","Pin","Hệ thống hai pin",false],
  ["Pin & Sạc","Sạc không dây","MagSafe 25W, Qi2 25W",false],
  ["Pin & Sạc","Sạc có dây","USB-C",false],
  ["Thiết kế","Khung","Titan cấp 5",false],
  ["Thiết kế","Kích thước khi mở","164,6 x 117,8 x 5,2 mm",true],
  ["Thiết kế","Trọng lượng","254 g",false],
  ["Thiết kế","Kháng nước, bụi","IP68",false],
  ["Thiết kế","Bản lề","Mở phẳng, giữ được ở nhiều góc",false]
]', '["iPhone gập đầu tiên: màn hình trong 7,6 inch, màn hình ngoài 5,4 inch","Khi mở chỉ mỏng 5,2 mm, khung titan cấp 5","Chip A20 Pro, tản nhiệt buồng hơi","Hệ thống hai pin, sạc MagSafe và Qi2 25W"]');

SELECT pg_temp.set_specs('galaxy-s26-ultra', '[
  ["Cấu hình & Bộ nhớ","Hệ điều hành","Android 16, One UI 8.5",false],
  ["Cấu hình & Bộ nhớ","Chip","Snapdragon 8 Elite Gen 5 for Galaxy (3nm)",true],
  ["Cấu hình & Bộ nhớ","GPU","Adreno 940",false],
  ["Cấu hình & Bộ nhớ","RAM","12GB / 16GB LPDDR5X",true],
  ["Cấu hình & Bộ nhớ","Bộ nhớ trong","256GB / 512GB / 1TB",false],
  ["Màn hình","Kích thước","6,9 inch",true],
  ["Màn hình","Công nghệ","Dynamic AMOLED 2X, QHD+",false],
  ["Màn hình","Tần số quét","1 đến 120Hz thích ứng",false],
  ["Màn hình","Độ sáng tối đa","2.600 nit",false],
  ["Màn hình","Mặt kính","Gorilla Armor chống chói",false],
  ["Camera sau","Camera chính","200MP, ƒ/1.4, chống rung OIS",true],
  ["Camera sau","Camera góc siêu rộng","50MP, ƒ/2.2",false],
  ["Camera sau","Camera tele 5x","50MP, ƒ/2.9, OIS",false],
  ["Camera sau","Camera tele 3x","10MP, ƒ/2.4, OIS",false],
  ["Camera sau","Quay video","8K 30fps, 4K 60/120fps",false],
  ["Camera trước","Camera trước","12MP, ƒ/2.2, Dual Pixel AF",false],
  ["Pin & Sạc","Dung lượng pin","5.000 mAh",true],
  ["Pin & Sạc","Sạc có dây","60W",false],
  ["Pin & Sạc","Sạc không dây","35W",false],
  ["Thiết kế","Chất liệu","Khung Armor Aluminum",false],
  ["Thiết kế","Kích thước","163,6 x 78,1 x 7,9 mm",false],
  ["Thiết kế","Trọng lượng","214 g",false],
  ["Thiết kế","Kháng nước, bụi","IP68 (1,5 m trong 30 phút)",false],
  ["Thiết kế","Bút","S Pen tích hợp",false],
  ["Kết nối","Mạng","5G, kết nối vệ tinh khẩn cấp",false],
  ["Kết nối","Wi-Fi, Bluetooth","Wi-Fi 7, Bluetooth 6.0",false],
  ["Kết nối","Khác","UWB, NFC",false],
  ["Kết nối","SIM","2 SIM vật lý hoặc 1 SIM + 1 eSIM",false]
]', '["Snapdragon 8 Elite Gen 5 for Galaxy, RAM đến 16GB","Camera chính 200MP cùng hai camera tele 3x và 5x","Pin 5.000 mAh, sạc nhanh 60W, sạc không dây 35W","Bút S Pen tích hợp, Galaxy AI"]');

SELECT pg_temp.set_specs('macbook-air-13-m5', '[
  ["Cấu hình","Chip","Apple M5",true],
  ["Cấu hình","CPU","10 lõi (4 lõi hiệu năng, 6 lõi tiết kiệm điện)",false],
  ["Cấu hình","GPU","10 lõi, Neural Accelerators, dò tia phần cứng",false],
  ["Cấu hình","Neural Engine","16 lõi",false],
  ["Cấu hình","RAM","16GB (băng thông 153GB/s)",true],
  ["Cấu hình","Ổ cứng","SSD 512GB",true],
  ["Màn hình","Kích thước","13,6 inch Liquid Retina",true],
  ["Màn hình","Độ phân giải","2560 x 1664",false],
  ["Màn hình","Độ sáng","500 nit, một tỷ màu, dải màu P3, True Tone",false],
  ["Màn hình","Màn hình ngoài","Hỗ trợ tối đa 2 màn hình",false],
  ["Pin & Sạc","Pin","53,8 Wh, xem video đến 18 giờ",true],
  ["Pin & Sạc","Bộ sạc kèm theo","USB-C 30W",false],
  ["Kết nối","Cổng","2 Thunderbolt 4 (USB-C), MagSafe 3, jack tai nghe 3,5 mm",false],
  ["Kết nối","Không dây","Wi-Fi 7",false],
  ["Kết nối","Camera","12MP Center Stage",false],
  ["Thiết kế","Độ dày","Khoảng 11,3 mm",false],
  ["Thiết kế","Trọng lượng","Khoảng 1,23 kg",false],
  ["Thiết kế","Màu sắc","Bạc, Ánh Sao, Xanh da trời, Đêm xanh thẳm",false]
]', '["Chip M5 CPU 10 lõi, GPU 10 lõi có dò tia","Mỏng khoảng 11,3 mm, nặng khoảng 1,23 kg","Pin xem video đến 18 giờ","Wi-Fi 7, hai cổng Thunderbolt 4 và MagSafe 3"]');

-- ---------- 7. Phụ kiện và thiết bị chính hãng ----------
-- Đồng hồ thông minh
SELECT pg_temp.add_product('dong-ho','apple','Apple Watch Series 12','apple-watch-series-12',
  'Chip S11, màn hình LTPO3 sáng 2.000 nit', 0, NULL, TRUE,
  '[["42mm GPS", 11490000]]', '[["Đen","#1D1D1F"],["Bạc","#E3E4E5"]]',
  '[["Màn hình","Công nghệ","OLED góc rộng LTPO3 Retina, Luôn Bật",true],
    ["Màn hình","Độ phân giải","374 x 446 pixels (42mm), 326 ppi",false],
    ["Màn hình","Độ sáng","Tối đa 2.000 nit, tối thiểu 1 nit",true],
    ["Hiệu năng","Chip","Apple S11 64-bit lõi kép, Neural Engine 4 lõi",true],
    ["Hiệu năng","Bộ nhớ","64GB",false],
    ["Pin & Sạc","Thời lượng","Đến 24 giờ, khoảng 38 giờ ở chế độ nguồn điện thấp",true],
    ["Pin & Sạc","Sạc nhanh","Khoảng 80% sau 30 phút",false],
    ["Thiết kế","Kích cỡ","42mm (có bản 46mm)",false],
    ["Thiết kế","Độ dày","9,7 mm",false],
    ["Thiết kế","Mặt kính","Ceramic Shield 2 (bản nhôm)",false],
    ["Thiết kế","Kháng nước, bụi","WR50 (50 m), IP6X",false],
    ["Kết nối","Không dây","Wi-Fi 4, Bluetooth 5.3, UWB thế hệ 2",false]]',
  '["Chip S11 mới, màn hình LTPO3 sáng đến 2.000 nit","Pin đến 24 giờ, sạc nhanh 80% trong 30 phút","Kháng nước 50 m, chống bụi IP6X"]');

SELECT pg_temp.add_product('dong-ho','apple','Apple Watch Ultra 3','apple-watch-ultra-3',
  'Vỏ titan 49mm, 5G, SOS qua vệ tinh', 0, NULL, FALSE,
  '[["49mm 5G", 21990000]]', '[["Titan Tự Nhiên","#C9C2B6"],["Titan Đen","#2B2B2D"]]',
  '[["Màn hình","Công nghệ","OLED góc rộng LTPO3, Luôn Bật",true],
    ["Màn hình","Độ sáng","Tối đa 3.000 nit",false],
    ["Hiệu năng","Chip","Apple S10",true],
    ["Pin & Sạc","Thời lượng","Đến 42 giờ, đến 72 giờ ở chế độ nguồn điện thấp",true],
    ["Thiết kế","Vỏ","Titan 49mm, mặt kính sapphire",false],
    ["Thiết kế","Kháng nước","WR100 (100 m), lặn đến 40 m",false],
    ["Kết nối","Mạng","5G, SOS khẩn cấp qua vệ tinh",true]]',
  '["Pin đến 42 giờ, 72 giờ ở chế độ nguồn điện thấp","5G và gửi SOS qua vệ tinh khi không có sóng","Vỏ titan, kháng nước 100 m, lặn đến 40 m"]');

-- Âm thanh
SELECT pg_temp.add_product('tai-nghe','apple','AirPods Pro 3','airpods-pro-3',
  'Chống ồn gấp đôi AirPods Pro 2, đo nhịp tim', 0, NULL, TRUE,
  '[["Hộp sạc USB-C", 6799000]]', '[["Trắng","#F5F5F7"]]',
  '[["Âm thanh","Chống ồn","Chống ồn chủ động gấp đôi AirPods Pro 2, chế độ Xuyên âm",true],
    ["Âm thanh","Âm thanh","Kiến trúc âm thanh đa cổng, EQ thích ứng thế hệ mới",false],
    ["Pin","Thời lượng","Khoảng 8 giờ khi bật chống ồn, hơn 30 giờ kèm hộp sạc",true],
    ["Sức khoẻ","Đo nhịp tim","Cảm biến nhịp tim, theo dõi hơn 50 bài tập",true],
    ["Tính năng","Dịch trực tiếp","Live Translation với Apple Intelligence",false],
    ["Thiết kế","Kháng nước, bụi","IP57",false],
    ["Thiết kế","Nút tai","5 cỡ, có cỡ XXS mới",false]]',
  '["Chống ồn gấp đôi AirPods Pro 2","Đo nhịp tim ngay trên tai khi tập luyện","Kháng nước, bụi IP57","Dịch trực tiếp cuộc trò chuyện"]');

SELECT pg_temp.add_product('tai-nghe','apple','AirPods 4 chống ồn chủ động','airpods-4-anc',
  'Chip H2, chống ồn chủ động, sạc USB-C và Qi', 700000, NULL, FALSE,
  '[["ANC", 4990000]]', '[["Trắng","#F5F5F7"]]',
  '[["Âm thanh","Chip","Apple H2",true],
    ["Âm thanh","Chống ồn","Chống ồn chủ động, chế độ Xuyên âm",true],
    ["Pin","Thời lượng","Đến 4 giờ khi bật chống ồn, 5 giờ khi tắt",false],
    ["Pin","Sạc","USB-C và sạc không dây Qi",false],
    ["Thiết kế","Trọng lượng","Tai nghe 4,3 g, hộp sạc 34,7 g",false]]',
  '["Chống ồn chủ động trong thiết kế không nút tai","Chip H2, sạc USB-C và không dây"]');

SELECT pg_temp.add_product('tai-nghe','sony','Sony WH-1000XM6','sony-wh-1000xm6',
  'Tai nghe chụp tai chống ồn hàng đầu, pin 40 giờ', 2400000, NULL, TRUE,
  '[["Chính hãng", 11990000]]', '[["Đen","#1C1C1C"],["Bạc","#D8D6D0"],["Xanh","#3D4F66"]]',
  '[["Âm thanh","Chống ồn","Adaptive NC Optimizer, 12 micro (6 mỗi bên)",true],
    ["Âm thanh","Màng loa","30 mm",false],
    ["Âm thanh","Chuẩn âm thanh","Hi-Res Audio, 360 Reality Audio",false],
    ["Pin","Thời lượng","Đến 30 giờ khi bật chống ồn, 40 giờ khi tắt",true],
    ["Pin","Sạc","Hỗ trợ sạc nhanh",false],
    ["Kết nối","Bluetooth","5.3, kết nối 2 thiết bị cùng lúc",true],
    ["Thiết kế","Trọng lượng","254 g",false]]',
  '["Chống ồn thích ứng với 12 micro","Pin đến 40 giờ, có sạc nhanh","Kết nối cùng lúc 2 thiết bị"]');

SELECT pg_temp.add_product('loa','jbl','Loa Bluetooth JBL Flip 7','jbl-flip-7',
  'Công suất 35W, chống nước IP68, Auracast', 230000, NULL, FALSE,
  '[["Chính hãng", 3520000]]', '[["Đen","#1C1C1C"],["Xanh dương","#2D5DA8"],["Đỏ","#C8102E"],["Trắng","#F2F2F2"]]',
  '[["Âm thanh","Công suất","35W RMS (woofer 25W, tweeter 10W)",true],
    ["Pin","Thời lượng","14 giờ, thêm 2 giờ với Playtime Boost",true],
    ["Pin","Sạc","USB-C, đầy trong khoảng 2,5 giờ",false],
    ["Kết nối","Bluetooth","5.4, Auracast ghép nhiều loa",false],
    ["Thiết kế","Kháng nước, bụi","IP68",true],
    ["Thiết kế","Kích thước","182,5 x 69,5 x 71,5 mm",false],
    ["Thiết kế","Trọng lượng","560 g",false]]',
  '["Công suất 35W, âm trầm mạnh","Chống nước, bụi IP68","Auracast ghép nhiều loa JBL"]');

-- Gaming gear
SELECT pg_temp.add_product('tay-cam','sony','Tay cầm PS5 DualSense','tay-cam-ps5-dualsense',
  'Phản hồi xúc giác, cò thích ứng', 300000, NULL, TRUE,
  '[["Chính hãng", 2090000]]', '[["Trắng","#F2F2F2"],["Đen","#1C1C1C"]]',
  '[["Tính năng","Rung","Phản hồi xúc giác (haptic feedback)",true],
    ["Tính năng","Cò bắn","Cò thích ứng (adaptive trigger) thay đổi lực bấm",true],
    ["Tính năng","Cảm biến","SIXAXIS: con quay 3 trục, gia tốc 3 trục",false],
    ["Tính năng","Khác","Loa và micro tích hợp, nút tắt micro, nút Create",false],
    ["Pin & Sạc","Pin","Li-ion 1.560 mAh",false],
    ["Kết nối","Cổng","USB-C, jack tai nghe 3,5 mm",false],
    ["Kết nối","Tương thích","PS5",true]]',
  '["Phản hồi xúc giác và cò thích ứng cho cảm giác chân thực","Loa, micro tích hợp, cổng USB-C"]');

SELECT pg_temp.add_product('ban-phim-co','attack-shark','Bàn phím cơ Attack Shark K86','attack-shark-k86',
  'Layout 75%, 3 chế độ kết nối, màn hình TFT, núm xoay', 390000, NULL, TRUE,
  '[["Không dây 3 chế độ", 1990000]]', '[["Retro Grey","#8E9196"],["Retro Blue","#4E6A8C"],["Lavender Blue","#9AA3D6"]]',
  '[["Thiết kế","Layout","75%, 86 phím, ANSI",true],
    ["Thiết kế","Cấu trúc","Gasket mount, hot-swap thay switch không cần hàn",true],
    ["Thiết kế","Núm xoay","Kim loại CNC: chỉnh âm lượng, đèn, chế độ kết nối",false],
    ["Thiết kế","Màn hình","TFT màu: pin, chế độ kết nối, giờ, ảnh GIF tuỳ chỉnh",false],
    ["Kết nối","Chế độ","Bluetooth, 2.4GHz không dây, USB-C có dây",true],
    ["Pin","Dung lượng","4.000 mAh",false],
    ["Thiết kế","Đèn nền","RGB",false]]',
  '["Gasket mount, hot-swap dễ thay switch","3 chế độ kết nối, pin 4.000 mAh","Màn hình TFT và núm xoay kim loại"]');

SELECT pg_temp.add_product('chuot-gaming','attack-shark','Chuột gaming Attack Shark X3','attack-shark-x3',
  'Cảm biến PAW3395, nặng 49 g, 3 chế độ kết nối', 0, NULL, FALSE,
  '[["Không dây 3 chế độ", 675000]]', '[["Đen","#1C1C1C"],["Trắng","#F2F2F2"]]',
  '[["Hiệu năng","Cảm biến","PixArt PAW3395, gia tốc 50G",true],
    ["Hiệu năng","DPI","50 đến 26.000",true],
    ["Hiệu năng","Tần số phản hồi","125 / 250 / 500 / 1.000 Hz",false],
    ["Hiệu năng","Switch","Kailh GM 8.0, độ bền 80 triệu lần nhấn",false],
    ["Kết nối","Chế độ","Bluetooth, 2.4GHz không dây, USB-C có dây",false],
    ["Pin","Pin","300 mAh, dùng đến 200 giờ",false],
    ["Thiết kế","Trọng lượng","49 g",true],
    ["Thiết kế","Kích thước","118 x 61 x 40 mm",false]]',
  '["Siêu nhẹ 49 g, cảm biến PAW3395 đến 26.000 DPI","Pin dùng đến 200 giờ"]');

-- Pin dự phòng
SELECT pg_temp.add_product('pin','anker','Pin dự phòng Anker Zolo A110M 20.000mAh 45W','anker-zolo-20000-45w',
  'Tích hợp 2 cáp USB-C, sạc 4 thiết bị cùng lúc', 700000, NULL, TRUE,
  '[["20.000mAh 45W", 1650000]]', '[["Đen","#1C1C1C"],["Trắng","#F2F2F2"],["Xanh dương","#3B6FB6"],["Hồng","#F2B8C6"]]',
  '[["Pin","Dung lượng","20.000 mAh (72Wh)",true],
    ["Sạc ra","Công suất tối đa","45W (USB-C), 22,5W (USB-A)",true],
    ["Sạc ra","Cổng ra","2 cáp USB-C tích hợp, 1 USB-C, 1 USB-A",false],
    ["Sạc ra","Sạc cùng lúc","Tối đa 4 thiết bị",false],
    ["Sạc vào","Cổng vào","Cáp USB-C tích hợp hoặc cổng USB-C, tối đa 30W",false],
    ["Sạc vào","Thời gian sạc đầy","Khoảng 2,5 giờ",false],
    ["Thiết kế","Kích thước","120 x 73 x 31 mm",false],
    ["Thiết kế","Cáp","Chống rối, chịu được 10.000 lần uốn",false]]',
  '["Có sẵn 2 cáp USB-C, không cần mang thêm dây","Sạc nhanh 45W, sạc 4 thiết bị cùng lúc"]');

SELECT pg_temp.add_product('pin','xiaomi','Pin dự phòng Xiaomi 33W 20.000mAh (cáp tích hợp)','xiaomi-33w-20000',
  'Cáp USB-C tích hợp, sạc 3 thiết bị cùng lúc', 0, NULL, FALSE,
  '[["PB2030MI", 690000]]', '[["Xanh dương","#5C7FA3"],["Nâu","#8A6E5A"]]',
  '[["Pin","Dung lượng","20.000 mAh (74Wh)",true],
    ["Sạc ra","Công suất tối đa","33W",true],
    ["Sạc ra","Cổng ra","Cáp USB-C tích hợp, 1 USB-C, 1 USB-A",false],
    ["Sạc vào","Cổng vào","Cáp USB-C tích hợp hoặc cổng USB-C",false],
    ["Tính năng","Chế độ dòng thấp","Sạc tai nghe, vòng đeo tay (nhấn đúp nút)",false],
    ["Tính năng","Bảo vệ","9 lớp bảo vệ: quá nhiệt, đoản mạch, quá sạc",false],
    ["Thiết kế","Kích thước","127 x 70,5 x 30,5 mm",false],
    ["Thiết kế","Bảo hành","12 tháng",false]]',
  '["Cáp USB-C có sẵn, sạc nhanh 33W","Đủ chuẩn mang lên máy bay (dưới 100Wh)"]');

-- Sạc và cáp
SELECT pg_temp.add_product('sac-cap','apple','Củ sạc Apple 20W USB-C','apple-20w-usb-c',
  'Chính hãng Apple Việt Nam, sạc nhanh iPhone', 370000, NULL, TRUE,
  '[["20W", 890000]]', '[["Trắng","#F5F5F7"]]',
  '[["Sạc","Công suất","20W",true],["Sạc","Cổng","1 cổng USB-C",true],["Sạc","Tương thích","iPhone, iPad, AirPods",false]]',
  '["Sạc nhanh iPhone 50% trong khoảng 30 phút"]');

SELECT pg_temp.add_product('sac-cap','anker','Củ sạc Anker GaN 70W 4 cổng A121C','anker-gan-70w-a121c',
  '3 USB-C + 1 USB-A, sạc được laptop', 160000, NULL, FALSE,
  '[["70W", 750000]]', '[["Trắng","#F2F2F2"]]',
  '[["Sạc","Công suất tối đa","70W",true],["Sạc","Cổng","3 USB-C, 1 USB-A",true],["Sạc","Công nghệ","GaN nhỏ gọn, toả nhiệt tốt",false]]',
  '["Một củ sạc cho cả laptop, điện thoại và tai nghe"]');

SELECT pg_temp.add_product('sac-cap','ugreen','Củ sạc Ugreen Nexode Robot Uno Gen 2 65W','ugreen-nexode-65w-x662',
  '2 USB-C + 1 USB-A, GaN thế hệ 2', 435000, NULL, FALSE,
  '[["65W", 900000]]', '[["Trắng","#F2F2F2"]]',
  '[["Sạc","Công suất tối đa","65W",true],["Sạc","Cổng","2 USB-C, 1 USB-A",true],["Sạc","Công nghệ","GaN Nexode thế hệ 2",false]]',
  '["Thiết kế robot dễ thương, đủ sức sạc MacBook Air"]');

SELECT pg_temp.add_product('sac-cap','samsung','Củ sạc Samsung 45W kèm cáp USB-C 1,8m','samsung-45w-ep-t4511',
  'Super Fast Charging 2.0 cho Galaxy', 340000, NULL, FALSE,
  '[["EP-T4511X", 1190000]]', '[["Đen","#1C1C1C"]]',
  '[["Sạc","Công suất","45W",true],["Sạc","Chuẩn sạc","Super Fast Charging 2.0",true],["Sạc","Đi kèm","Cáp USB-C sang USB-C 5A dài 1,8 m",false]]',
  '["Sạc siêu nhanh 45W cho Galaxy S26 Ultra"]');

SELECT pg_temp.add_product('sac-cap','apple','Cáp Apple USB-C dây dù 1m','apple-cap-usb-c-1m',
  'Chính hãng Apple, dây dù bền', 0, NULL, FALSE,
  '[["1m", 540000]]', '[["Trắng","#F5F5F7"]]',
  '[["Cáp","Đầu nối","USB-C sang USB-C",true],["Cáp","Chiều dài","1 m",false],["Cáp","Chất liệu","Dây dù",false]]',
  '["Cáp chính hãng Apple cho iPhone, iPad, MacBook"]');

SELECT pg_temp.add_product('sac-cap','anker','Cáp Anker Zolo USB-C 240W 1m','anker-zolo-240w-1m',
  'Sạc được laptop, dây bện bền', 10000, NULL, FALSE,
  '[["1m", 150000]]', '[["Đen","#1C1C1C"],["Trắng","#F2F2F2"]]',
  '[["Cáp","Công suất tối đa","240W",true],["Cáp","Đầu nối","USB-C sang USB-C",true],["Cáp","Chiều dài","1 m",false]]',
  '["240W đủ sạc laptop gaming, giá rất dễ chịu"]');

-- Kiểm tra: số sản phẩm theo danh mục gốc
SELECT root.name AS danh_muc, count(p.id) AS so_san_pham
FROM categories root
LEFT JOIN categories c ON c.id = root.id OR c.parent_id = root.id
LEFT JOIN products p ON p.category_id = c.id
WHERE root.parent_id IS NULL
GROUP BY root.name, root.sort_order
ORDER BY root.sort_order;
