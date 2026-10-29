-- =====================================================================
-- DH tech - MỞ RỘNG DANH MỤC: laptop, thêm điện thoại các hãng, thêm phụ kiện.
-- Chạy trên database ĐANG CÓ dữ liệu (sau schema.sql + seed.sql).
-- Không xoá gì; sản phẩm nào đã có (trùng slug) thì bỏ qua. Chạy lại nhiều lần vẫn an toàn.
--
-- Nguồn giá (tham khảo, tháng 9-10/2026):
--   iPhone 17 series: bảng giá bán lẻ cuối tháng 10 (Báo Đà Nẵng)
--   Galaxy Z Fold8/Flip8: giá khởi điểm (SGGP); Galaxy A57/A37: Đức Huy Mobile
--   Xiaomi/Redmi: XTmobile 01/10/2026; OPPO Reno15: Viettablet; Find X9: Viettel Store; vivo X300: Đức Huy Mobile
--   MacBook M5: giá dự kiến (Mytour); laptop Windows: Hoàng Hà Mobile, HACOM, CellphoneS
-- Giá thay đổi theo thời điểm: hãy kiểm tra và sửa lại trong trang Admin trước khi bán thật.
-- Màu sắc của một số mẫu (Galaxy Z, Xiaomi, vivo, laptop Windows) là màu tạm, cần cập nhật theo hàng thực tế.
-- Phụ kiện không ghi thương hiệu là dữ liệu mẫu.
-- =====================================================================

-- ---------- Danh mục mới ----------
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Laptop', 'laptop', 2)
ON CONFLICT (slug) DO NOTHING;
UPDATE categories SET sort_order = 3 WHERE slug = 'phu-kien';

INSERT INTO categories (parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.ord
FROM categories c
JOIN (VALUES
  ('Loa',               'loa',            6),
  ('Chuột, bàn phím',   'chuot-ban-phim', 7),
  ('Balo, túi laptop',  'balo-tui',       8),
  ('Hub, giá đỡ',       'hub-gia-do',     9)
) AS v(name, slug, ord) ON c.slug = 'phu-kien'
ON CONFLICT (slug) DO NOTHING;

-- ---------- Thương hiệu mới ----------
INSERT INTO brands (name, slug)
SELECT v.name, v.slug FROM (VALUES
  ('Xiaomi','xiaomi'), ('OPPO','oppo'), ('vivo','vivo'),
  ('Lenovo','lenovo'), ('ASUS','asus'), ('Acer','acer')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.slug = v.slug);

-- ---------- Sản phẩm ----------
INSERT INTO products (category_id, brand_id, name, slug, short_desc, discount_amount, gift_text, is_hot)
SELECT c.id, b.id, v.name, v.slug, v.short_desc, v.discount, v.gift, v.hot
FROM (VALUES
  -- iPhone 17 series
  ('dien-thoai','apple','iPhone 17 Pro Max','iphone-17-pro-max','Màn hình 6.9 inch, chip A19 Pro',            800000,'Thu cũ trợ giá đến 2 triệu', true),
  ('dien-thoai','apple','iPhone 17 Pro','iphone-17-pro','Màn hình 6.3 inch, chip A19 Pro',                    700000,'Thu cũ trợ giá đến 2 triệu', false),
  ('dien-thoai','apple','iPhone 17','iphone-17','Màn hình 6.3 inch 120Hz, chip A19',                          500000,'Tặng cường lực khi mua online', true),
  ('dien-thoai','apple','iPhone Air','iphone-air','Thiết kế siêu mỏng, màn hình 6.5 inch',                    1000000,'Thu cũ trợ giá đến 2 triệu', false),
  ('dien-thoai','apple','iPhone 17e','iphone-17e','iPhone dễ tiếp cận nhất của năm',                          300000,NULL, false),
  -- Samsung
  ('dien-thoai','samsung','Samsung Galaxy Z Fold8 Ultra','galaxy-z-fold8-ultra','Màn hình gập cỡ lớn, mỏng khoảng 4,1 mm khi mở', 3000000,'Tặng bao da kèm bút', true),
  ('dien-thoai','samsung','Samsung Galaxy Z Fold8','galaxy-z-fold8','Điện thoại gập dạng sách, Galaxy AI',    2500000,'Tặng bao da chính hãng', false),
  ('dien-thoai','samsung','Samsung Galaxy Z Flip8','galaxy-z-flip8','Gập vỏ sò nhỏ gọn, thời trang',           2000000,'Tặng ốp lưng chính hãng', true),
  ('dien-thoai','samsung','Samsung Galaxy A57 5G','galaxy-a57','Màn hình 6.7 inch 120Hz, sạc nhanh 45W',      500000,NULL, false),
  ('dien-thoai','samsung','Samsung Galaxy A37 5G','galaxy-a37','Exynos 1480, camera 50MP chống rung OIS',     400000,NULL, false),
  -- Xiaomi
  ('dien-thoai','xiaomi','Xiaomi 17 Ultra','xiaomi-17-ultra','Flagship camera của Xiaomi',                    1500000,'Tặng sạc nhanh chính hãng', true),
  ('dien-thoai','xiaomi','Xiaomi 17 Pro','xiaomi-17-pro','Hiệu năng cao, thiết kế cao cấp',                   1000000,NULL, false),
  ('dien-thoai','xiaomi','Xiaomi 17T Pro','xiaomi-17t-pro','Cận cao cấp, cấu hình mạnh',                       800000,NULL, false),
  ('dien-thoai','xiaomi','Xiaomi 17T','xiaomi-17t','Cấu hình tốt trong tầm giá',                               600000,NULL, false),
  ('dien-thoai','xiaomi','Redmi Note 17 Pro 5G','redmi-note-17-pro','Tầm trung đáng tiền',                     500000,NULL, true),
  ('dien-thoai','xiaomi','Redmi Note 15 5G','redmi-note-15-5g','Giá dễ chịu, có 5G',                           300000,NULL, false),
  -- OPPO, vivo
  ('dien-thoai','oppo','OPPO Find X9','oppo-find-x9','Dimensity 9500, pin 7.025 mAh',                          1500000,'Tặng tai nghe không dây', true),
  ('dien-thoai','oppo','OPPO Reno15 Pro','oppo-reno15-pro','Camera chính 200MP, nhỏ gọn 6.32 inch',            800000,NULL, false),
  ('dien-thoai','oppo','OPPO Reno15','oppo-reno15','Pin 6.500 mAh, chuẩn IP69',                                600000,NULL, false),
  ('dien-thoai','oppo','OPPO Reno15 F','oppo-reno15-f','Pin 7.000 mAh, sạc nhanh 80W',                         500000,NULL, false),
  ('dien-thoai','vivo','vivo X300','vivo-x300','Camera 200MP, nhỏ gọn 6.31 inch',                             1000000,'Tặng ốp lưng và cường lực', false),
  -- Laptop Apple
  ('laptop','apple','MacBook Air 13 inch M5','macbook-air-13-m5','Mỏng nhẹ, chip M5 CPU 10 lõi',              1000000,'Giảm thêm cho học sinh, sinh viên', true),
  ('laptop','apple','MacBook Air 15 inch M5','macbook-air-15-m5','Màn hình lớn, chip M5',                     1000000,'Giảm thêm cho học sinh, sinh viên', false),
  ('laptop','apple','MacBook Pro 14 inch M5 Pro','macbook-pro-14-m5-pro','Chip M5 Pro, cho dân sáng tạo',      2000000,NULL, false),
  ('laptop','apple','MacBook Pro 16 inch M5 Pro','macbook-pro-16-m5-pro','Màn hình 16 inch, chip M5 Pro',      2000000,NULL, false),
  -- Laptop Lenovo
  ('laptop','lenovo','Lenovo IdeaPad Slim 3 14IWC11','lenovo-ideapad-slim-3-14iwc11','Văn phòng, học tập, 14 inch', 500000,'Tặng chuột không dây', false),
  ('laptop','lenovo','Lenovo IdeaPad Slim 5 15ARP10','lenovo-ideapad-slim-5-15arp10','Ryzen 5, SSD 1TB',      700000,'Tặng balo laptop', false),
  ('laptop','lenovo','Lenovo LOQ 15IRX10','lenovo-loq-15irx10','Gaming, CPU Intel HX, card RTX',              1500000,'Tặng chuột gaming', false),
  ('laptop','lenovo','Lenovo Legion 5 15AHP10','lenovo-legion-5-15ahp10','Màn OLED 2.5K 165Hz, RTX 5050',     6000000,'Tặng balo Legion', true),
  -- Laptop ASUS
  ('laptop','asus','ASUS Vivobook 14 X1404VA','asus-vivobook-14-x1404va','Laptop học tập giá tốt',            300000,NULL, false),
  ('laptop','asus','ASUS Gaming Vivobook K3605VC','asus-gaming-vivobook-k3605vc','Core i5, card đồ hoạ rời, 16 inch', 800000,NULL, false),
  ('laptop','asus','ASUS TUF Gaming F16 FX607VU','asus-tuf-gaming-f16-fx607vu','Gaming bền bỉ, màn 16 inch',  1000000,'Tặng chuột gaming', false),
  -- Laptop Acer
  ('laptop','acer','Acer Aspire 5 A515-58M','acer-aspire-5-a515-58m','Core i5, văn phòng 15.6 inch',           500000,NULL, false),
  ('laptop','acer','Acer Swift Go 14 SFG14-41','acer-swift-go-14-sfg14-41','Dưới 1,3 kg, SSD 1TB',             500000,NULL, false),
  ('laptop','acer','Acer Nitro V 15','acer-nitro-v-15','Gaming phổ thông, màn 180Hz',                          1000000,'Tặng chuột gaming', true),
  ('laptop','acer','Acer Predator Helios Neo 16','acer-predator-helios-neo-16','Gaming cao cấp 16 inch',       3000000,'Tặng balo Predator', false),
  -- Phụ kiện (dữ liệu mẫu)
  ('sac-cap',NULL,'Củ sạc GaN 65W 3 cổng','sac-gan-65w','Sạc được cả laptop, điện thoại, tai nghe',            200000,NULL, true),
  ('sac-cap',NULL,'Củ sạc nhanh 20W USB-C','sac-20w-usbc','Nhỏ gọn, sạc nhanh iPhone',                          50000,NULL, false),
  ('sac-cap',NULL,'Cáp USB-C 240W bện dù 2m','cap-usbc-240w-2m','Sạc laptop công suất cao',                     60000,NULL, false),
  ('sac-cap',NULL,'Sạc không dây MagSafe 15W','sac-khong-day-magsafe-15w','Hít nam châm, sạc không dây',       100000,NULL, false),
  ('sac-cap',NULL,'Đế sạc không dây 3 trong 1','de-sac-3-trong-1','Sạc cùng lúc điện thoại, đồng hồ, tai nghe',200000,NULL, false),
  ('pin',NULL,'Pin dự phòng 20.000mAh 65W','pin-20000mah-65w','Sạc được laptop USB-C',                         200000,NULL, true),
  ('pin',NULL,'Pin dự phòng MagSafe 5.000mAh','pin-magsafe-5000mah','Mỏng, gắn lưng iPhone',                   100000,NULL, false),
  ('op-lung',NULL,'Ốp lưng chống sốc Galaxy S26 Ultra','op-chong-soc-s26-ultra','Viền dày, chống va đập',       60000,NULL, false),
  ('kinh',NULL,'Kính cường lực iPhone 18 Pro Max','kinh-iphone-18-pro-max','Phủ chống vân tay, có khung dán',  50000,NULL, false),
  ('tai-nghe',NULL,'Tai nghe chụp tai chống ồn Bluetooth','tai-nghe-chup-tai-anc','Pin 40 giờ, gập gọn',       300000,NULL, false),
  ('tai-nghe',NULL,'Tai nghe có dây USB-C','tai-nghe-day-usbc','Có micro, nút chỉnh âm lượng',                  30000,NULL, false),
  ('loa',NULL,'Loa Bluetooth mini chống nước','loa-bluetooth-mini','Chuẩn IPX7, pin 12 giờ',                   100000,NULL, false),
  ('chuot-ban-phim',NULL,'Chuột không dây im lặng','chuot-khong-day-im-lang','Click êm, pin AA dùng 12 tháng',  40000,NULL, false),
  ('chuot-ban-phim',NULL,'Bàn phím cơ không dây 75%','ban-phim-co-75','Kết nối 3 chế độ, đèn nền',             200000,NULL, false),
  ('balo-tui',NULL,'Balo laptop 15.6 inch chống nước','balo-laptop-15','Ngăn chống sốc riêng cho laptop',     100000,NULL, false),
  ('balo-tui',NULL,'Túi chống sốc laptop 14 inch','tui-chong-soc-14','Vải dày, lót nhung',                       30000,NULL, false),
  ('hub-gia-do',NULL,'Hub USB-C 7 trong 1','hub-usbc-7-in-1','HDMI 4K, USB-A, thẻ nhớ, sạc 100W',              100000,NULL, false),
  ('hub-gia-do',NULL,'Giá đỡ laptop nhôm','gia-do-laptop-nhom','Nâng màn hình ngang tầm mắt',                    50000,NULL, false)
) AS v(cat, brand, name, slug, short_desc, discount, gift, hot)
JOIN categories c ON c.slug = v.cat
LEFT JOIN brands b ON b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

-- ---------- Phiên bản và giá ----------
-- Chỉ thêm cho sản phẩm chưa có phiên bản nào (sản phẩm vừa tạo ở trên)
INSERT INTO product_variants (product_id, name, list_price, sort_order)
SELECT p.id, v.name, v.price, v.ord
FROM (VALUES
  ('iphone-17-pro-max','256GB',33590000,1),('iphone-17-pro-max','512GB',40490000,2),('iphone-17-pro-max','1TB',46790000,3),('iphone-17-pro-max','2TB',58890000,4),
  ('iphone-17-pro','256GB',30790000,1),('iphone-17-pro','512GB',37390000,2),('iphone-17-pro','1TB',42890000,3),
  ('iphone-17','256GB',27590000,1),('iphone-17','512GB',29790000,2),
  ('iphone-air','256GB',23490000,1),('iphone-air','512GB',28590000,2),('iphone-air','1TB',33290000,3),
  ('iphone-17e','256GB',16790000,1),('iphone-17e','512GB',22890000,2),
  ('galaxy-z-fold8-ultra','12GB · 256GB',52990000,1),
  ('galaxy-z-fold8','12GB · 256GB',46990000,1),
  ('galaxy-z-flip8','256GB',31990000,1),
  ('galaxy-a57','8GB · 128GB',8799000,1),('galaxy-a57','8GB · 256GB',10599000,2),('galaxy-a57','12GB · 256GB',10999000,3),
  ('galaxy-a37','6GB · 128GB',7299000,1),('galaxy-a37','8GB · 128GB',7799000,2),('galaxy-a37','8GB · 256GB',8199000,3),
  ('xiaomi-17-ultra','16GB · 512GB',29999000,1),('xiaomi-17-ultra','16GB · 1TB',35499000,2),
  ('xiaomi-17-pro','12GB · 256GB',21999000,1),('xiaomi-17-pro','16GB · 512GB',24999000,2),
  ('xiaomi-17t-pro','12GB · 512GB',16899000,1),('xiaomi-17t-pro','12GB · 1TB',22099000,2),
  ('xiaomi-17t','12GB · 256GB',12899000,1),('xiaomi-17t','12GB · 512GB',13699000,2),
  ('redmi-note-17-pro','8GB · 256GB',10990000,1),('redmi-note-17-pro','12GB · 256GB',11990000,2),
  ('redmi-note-15-5g','6GB · 128GB',5899000,1),('redmi-note-15-5g','8GB · 256GB',6899000,2),
  ('oppo-find-x9','12GB · 256GB',22990000,1),('oppo-find-x9','12GB · 512GB',26990000,2),
  ('oppo-reno15-pro','12GB · 256GB',13999000,1),('oppo-reno15-pro','12GB · 512GB',16799000,2),
  ('oppo-reno15','8GB · 256GB',12399000,1),('oppo-reno15','12GB · 256GB',12499000,2),
  ('oppo-reno15-f','8GB · 256GB',9399000,1),('oppo-reno15-f','12GB · 256GB',10999000,2),
  ('vivo-x300','12GB · 256GB',21599000,1),
  ('macbook-air-13-m5','16GB · 512GB',29999000,1),('macbook-air-13-m5','24GB · 512GB',35999000,2),('macbook-air-13-m5','16GB · 1TB',35499000,3),
  ('macbook-air-15-m5','16GB · 512GB',34999000,1),('macbook-air-15-m5','24GB · 512GB',39999000,2),('macbook-air-15-m5','16GB · 1TB',40499000,3),
  ('macbook-pro-14-m5-pro','24GB · 1TB',59999000,1),('macbook-pro-14-m5-pro','48GB · 1TB',70999000,2),
  ('macbook-pro-16-m5-pro','24GB · 1TB',72999000,1),('macbook-pro-16-m5-pro','48GB · 1TB',83999000,2),
  ('lenovo-ideapad-slim-3-14iwc11','Core i5 · 8GB · 512GB',18290000,1),
  ('lenovo-ideapad-slim-5-15arp10','Ryzen 5 7235HS · 1TB',24490000,1),
  ('lenovo-loq-15irx10','Intel HX · RTX',38990000,1),
  ('lenovo-legion-5-15ahp10','Ryzen 7 260 · 16GB · 512GB · RTX 5050',42999000,1),
  ('asus-vivobook-14-x1404va','Core i3 · 8GB · 512GB',12790000,1),
  ('asus-gaming-vivobook-k3605vc','Core i5 · card rời',19890000,1),
  ('asus-tuf-gaming-f16-fx607vu','16GB RAM',26790000,1),
  ('acer-aspire-5-a515-58m','Core i5 · 512GB',17990000,1),
  ('acer-swift-go-14-sfg14-41','Ryzen 5 7430U · 16GB · 1TB',18490000,1),
  ('acer-nitro-v-15','Card rời · 180Hz',19990000,1),
  ('acer-predator-helios-neo-16','Bản tiêu chuẩn',59990000,1),
  ('sac-gan-65w','65W',890000,1),
  ('sac-20w-usbc','20W',290000,1),
  ('cap-usbc-240w-2m','2m',390000,1),
  ('sac-khong-day-magsafe-15w','15W',590000,1),
  ('de-sac-3-trong-1','3 trong 1',1190000,1),
  ('pin-20000mah-65w','20.000mAh',1290000,1),
  ('pin-magsafe-5000mah','5.000mAh',790000,1),
  ('op-chong-soc-s26-ultra','S26 Ultra',390000,1),
  ('kinh-iphone-18-pro-max','iPhone 18 Pro Max',290000,1),('kinh-iphone-18-pro-max','iPhone 18 Pro',290000,2),
  ('tai-nghe-chup-tai-anc','Bản tiêu chuẩn',1990000,1),
  ('tai-nghe-day-usbc','1.2m',190000,1),
  ('loa-bluetooth-mini','Bản tiêu chuẩn',690000,1),
  ('chuot-khong-day-im-lang','Bản tiêu chuẩn',290000,1),
  ('ban-phim-co-75','Switch đỏ',1490000,1),('ban-phim-co-75','Switch nâu',1490000,2),
  ('balo-laptop-15','15.6 inch',590000,1),
  ('tui-chong-soc-14','14 inch',190000,1),('tui-chong-soc-14','15.6 inch',220000,2),
  ('hub-usbc-7-in-1','7 trong 1',690000,1),
  ('gia-do-laptop-nhom','Bản tiêu chuẩn',390000,1)
) AS v(slug, name, price, ord)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants x WHERE x.product_id = p.id);

-- ---------- Màu sắc ----------
INSERT INTO product_colors (product_id, name, hex, sort_order)
SELECT p.id, v.name, v.hex, v.ord
FROM (VALUES
  ('iphone-17-pro-max','Cam Vũ Trụ','#C8642E',1),('iphone-17-pro-max','Xanh Đậm','#28344A',2),('iphone-17-pro-max','Bạc','#DADCDF',3),
  ('iphone-17-pro','Cam Vũ Trụ','#C8642E',1),('iphone-17-pro','Xanh Đậm','#28344A',2),('iphone-17-pro','Bạc','#DADCDF',3),
  ('iphone-17','Đen','#232427',1),('iphone-17','Trắng','#ECEBE7',2),('iphone-17','Xanh Sương Mù','#9FB3C8',3),('iphone-17','Tím Oải Hương','#C7B8D9',4),('iphone-17','Xanh Xô Thơm','#A9B79E',5),
  ('iphone-air','Đen Không Gian','#2A2B2E',1),('iphone-air','Trắng Mây','#EDEDEA',2),('iphone-air','Vàng Nhạt','#E7D9B8',3),('iphone-air','Xanh Da Trời','#B8CFE3',4),
  ('iphone-17e','Đen','#232427',1),('iphone-17e','Trắng','#ECEBE7',2),
  ('galaxy-z-fold8-ultra','Đen','#1F2124',1),('galaxy-z-fold8-ultra','Bạc','#CFD2D6',2),
  ('galaxy-z-fold8','Đen','#1F2124',1),('galaxy-z-fold8','Bạc','#CFD2D6',2),
  ('galaxy-z-flip8','Đen','#1F2124',1),('galaxy-z-flip8','Xanh','#7C93B5',2),
  ('galaxy-a57','Đen','#25272B',1),('galaxy-a57','Trắng','#E9E9E6',2),
  ('galaxy-a37','Xám Than','#3A3C40',1),('galaxy-a37','Xanh Lục Bảo','#3F7F6A',2),('galaxy-a37','Tím Ngọc Thạch','#9C8BBF',3),('galaxy-a37','Trắng Thạch Anh','#ECEAE6',4),
  ('xiaomi-17-ultra','Đen','#1E1F22',1),('xiaomi-17-ultra','Trắng','#ECEBE8',2),
  ('xiaomi-17-pro','Đen','#1E1F22',1),('xiaomi-17-pro','Xanh','#5F7FA6',2),
  ('xiaomi-17t-pro','Đen','#1E1F22',1),('xiaomi-17t-pro','Xám','#8A8D92',2),
  ('xiaomi-17t','Đen','#1E1F22',1),('xiaomi-17t','Xanh','#5F7FA6',2),
  ('redmi-note-17-pro','Đen','#1E1F22',1),('redmi-note-17-pro','Tím','#9A86B8',2),
  ('redmi-note-15-5g','Đen','#1E1F22',1),('redmi-note-15-5g','Xanh','#5F8FA6',2),
  ('oppo-find-x9','Titan','#9C9893',1),('oppo-find-x9','Đen','#1E1F22',2),('oppo-find-x9','Đỏ','#8E2F2F',3),
  ('oppo-reno15-pro','Nâu','#7A5A44',1),('oppo-reno15-pro','Xanh','#6C8FB0',2),
  ('oppo-reno15','Xanh','#7FA2C2',1),('oppo-reno15','Trắng','#EEEDEA',2),
  ('oppo-reno15-f','Hồng','#E3B5BE',1),('oppo-reno15-f','Xanh Đậm','#2F4466',2),('oppo-reno15-f','Xanh Nhạt','#A9C6DF',3),
  ('vivo-x300','Đen','#1E1F22',1),('vivo-x300','Trắng','#ECEBE8',2),
  ('macbook-air-13-m5','Bạc','#D7D9DC',1),('macbook-air-13-m5','Ánh Sao','#E3D9C6',2),('macbook-air-13-m5','Đêm Xanh Thẳm','#2B3442',3),('macbook-air-13-m5','Xanh Da Trời','#B4C8DC',4),
  ('macbook-air-15-m5','Bạc','#D7D9DC',1),('macbook-air-15-m5','Ánh Sao','#E3D9C6',2),('macbook-air-15-m5','Đêm Xanh Thẳm','#2B3442',3),('macbook-air-15-m5','Xanh Da Trời','#B4C8DC',4),
  ('macbook-pro-14-m5-pro','Đen Không Gian','#2C2D30',1),('macbook-pro-14-m5-pro','Bạc','#D7D9DC',2),
  ('macbook-pro-16-m5-pro','Đen Không Gian','#2C2D30',1),('macbook-pro-16-m5-pro','Bạc','#D7D9DC',2),
  ('lenovo-ideapad-slim-3-14iwc11','Xám','#7D8085',1),
  ('lenovo-ideapad-slim-5-15arp10','Xám','#7D8085',1),
  ('lenovo-loq-15irx10','Xám Đen','#3A3C40',1),
  ('lenovo-legion-5-15ahp10','Đen','#202124',1),
  ('asus-vivobook-14-x1404va','Bạc','#C9CCD0',1),
  ('asus-gaming-vivobook-k3605vc','Đen','#202124',1),
  ('asus-tuf-gaming-f16-fx607vu','Xám','#5D6066',1),
  ('acer-aspire-5-a515-58m','Bạc','#C9CCD0',1),
  ('acer-swift-go-14-sfg14-41','Bạc','#C9CCD0',1),
  ('acer-nitro-v-15','Đen','#202124',1),
  ('acer-predator-helios-neo-16','Đen','#202124',1),
  ('sac-gan-65w','Trắng','#F1F2F4',1),('sac-gan-65w','Đen','#24272D',2),
  ('sac-20w-usbc','Trắng','#F1F2F4',1),
  ('cap-usbc-240w-2m','Đen','#24272D',1),('cap-usbc-240w-2m','Trắng','#F1F2F4',2),
  ('sac-khong-day-magsafe-15w','Trắng','#F1F2F4',1),
  ('de-sac-3-trong-1','Trắng','#F1F2F4',1),('de-sac-3-trong-1','Đen','#24272D',2),
  ('pin-20000mah-65w','Đen','#24272D',1),
  ('pin-magsafe-5000mah','Trắng','#F1F2F4',1),('pin-magsafe-5000mah','Cam','#E8833A',2),
  ('op-chong-soc-s26-ultra','Đen','#24272D',1),('op-chong-soc-s26-ultra','Xanh Navy','#24324D',2),
  ('kinh-iphone-18-pro-max','Trong suốt','#DCE6F2',1),
  ('tai-nghe-chup-tai-anc','Đen','#24272D',1),('tai-nghe-chup-tai-anc','Kem','#E8E0D2',2),
  ('tai-nghe-day-usbc','Trắng','#F1F2F4',1),
  ('loa-bluetooth-mini','Đen','#24272D',1),('loa-bluetooth-mini','Cam','#E8833A',2),('loa-bluetooth-mini','Xanh Rêu','#5E6B4E',3),
  ('chuot-khong-day-im-lang','Đen','#24272D',1),('chuot-khong-day-im-lang','Hồng','#E3B5BE',2),
  ('ban-phim-co-75','Kem','#E8E0D2',1),('ban-phim-co-75','Đen','#24272D',2),
  ('balo-laptop-15','Đen','#24272D',1),('balo-laptop-15','Xám','#7D8085',2),
  ('tui-chong-soc-14','Xám','#7D8085',1),('tui-chong-soc-14','Xanh Navy','#24324D',2),
  ('hub-usbc-7-in-1','Xám','#7D8085',1),
  ('gia-do-laptop-nhom','Bạc','#C9CCD0',1),('gia-do-laptop-nhom','Xám','#7D8085',2)
) AS v(slug, name, hex, ord)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_colors x WHERE x.product_id = p.id);

-- ---------- Tồn kho: mọi tổ hợp phiên bản x màu ----------
-- Số lượng mẫu từ 0 đến 11 (một vài SKU = 0 để thấy "Hết hàng"). Admin sửa lại theo kho thật.
INSERT INTO product_skus (product_id, variant_id, color_id, sku_code, stock)
SELECT p.id, v.id, c.id,
       upper(p.slug) || '-V' || v.sort_order || '-C' || c.sort_order,
       abs(hashtext(p.slug || v.name || c.name)) % 12
FROM products p
JOIN product_variants v ON v.product_id = p.id
JOIN product_colors   c ON c.product_id = p.id
ON CONFLICT DO NOTHING;

-- ---------- Thông số (chỉ ghi những gì có nguồn; admin bổ sung thêm) ----------
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT p.id, v.label, v.value, v.ord
FROM (VALUES
  ('iphone-17-pro-max','Màn hình','6.9 inch',1),('iphone-17-pro-max','Chip','Apple A19 Pro',2),
  ('iphone-17-pro','Màn hình','6.3 inch',1),('iphone-17-pro','Chip','Apple A19 Pro',2),
  ('iphone-17','Màn hình','6.3 inch, 120Hz',1),('iphone-17','Chip','Apple A19',2),
  ('iphone-air','Màn hình','6.5 inch',1),('iphone-air','Chip','Apple A19 Pro',2),
  ('galaxy-z-fold8-ultra','Độ mỏng khi mở','Khoảng 4,1 mm',1),('galaxy-z-fold8-ultra','Tính năng','Galaxy AI, đa nhiệm màn hình lớn',2),
  ('galaxy-a57','Màn hình','6.7 inch Super AMOLED Plus, 120Hz',1),('galaxy-a57','Chip','Exynos 1680',2),('galaxy-a57','Pin','5.000 mAh, sạc nhanh 45W',3),('galaxy-a57','Camera chính','50MP',4),
  ('galaxy-a37','Màn hình','6.7 inch Super AMOLED',1),('galaxy-a37','Chip','Exynos 1480',2),('galaxy-a37','Pin','5.000 mAh, sạc nhanh 45W',3),('galaxy-a37','Camera chính','50MP, chống rung OIS',4),
  ('oppo-find-x9','Chip','MediaTek Dimensity 9500',1),('oppo-find-x9','Màn hình','6.59 inch AMOLED, 120Hz, 3.600 nits',2),('oppo-find-x9','Camera','3 camera 50MP',3),('oppo-find-x9','Pin','7.025 mAh, sạc nhanh 80W, không dây 50W',4),('oppo-find-x9','Chống nước','IP68, IP69',5),
  ('oppo-reno15-pro','Chip','Dimensity 8450',1),('oppo-reno15-pro','Màn hình','6.32 inch AMOLED, 120Hz',2),('oppo-reno15-pro','Camera','200MP chính, 50MP tele, 50MP góc rộng',3),('oppo-reno15-pro','Pin','6.200 mAh, sạc 80W',4),
  ('oppo-reno15','Chip','Snapdragon 7 Gen 4',1),('oppo-reno15','Màn hình','6.59 inch AMOLED, 120Hz',2),('oppo-reno15','Camera','50MP chính, 50MP tele, 8MP góc rộng',3),('oppo-reno15','Pin','6.500 mAh, sạc 80W',4),
  ('oppo-reno15-f','Chip','Snapdragon 6 Gen 1',1),('oppo-reno15-f','Màn hình','6.57 inch AMOLED, 120Hz',2),('oppo-reno15-f','Pin','7.000 mAh, sạc 80W',3),
  ('vivo-x300','Chip','MediaTek Dimensity 9500',1),('vivo-x300','Màn hình','6.31 inch AMOLED 1.5K, 120Hz',2),('vivo-x300','Camera','200MP chính, 50MP góc rộng, 50MP tele',3),('vivo-x300','Pin','6.040 mAh, sạc 90W, không dây 40W',4),
  ('macbook-air-13-m5','Chip','Apple M5, CPU 10 lõi',1),('macbook-air-13-m5','Màn hình','13 inch',2),
  ('macbook-air-15-m5','Chip','Apple M5, CPU 10 lõi',1),('macbook-air-15-m5','Màn hình','15 inch',2),
  ('macbook-pro-14-m5-pro','Chip','Apple M5 Pro',1),('macbook-pro-14-m5-pro','Màn hình','14 inch',2),
  ('macbook-pro-16-m5-pro','Chip','Apple M5 Pro',1),('macbook-pro-16-m5-pro','Màn hình','16 inch',2),
  ('lenovo-ideapad-slim-3-14iwc11','CPU','Intel Core i5',1),('lenovo-ideapad-slim-3-14iwc11','RAM','8GB',2),('lenovo-ideapad-slim-3-14iwc11','Ổ cứng','512GB SSD',3),('lenovo-ideapad-slim-3-14iwc11','Màn hình','14 inch',4),
  ('lenovo-ideapad-slim-5-15arp10','CPU','AMD Ryzen 5 7235HS',1),('lenovo-ideapad-slim-5-15arp10','Ổ cứng','1TB SSD',2),
  ('lenovo-loq-15irx10','CPU','Intel dòng HX',1),('lenovo-loq-15irx10','Card đồ hoạ','NVIDIA GeForce RTX',2),
  ('lenovo-legion-5-15ahp10','CPU','AMD Ryzen 7 260 (8 nhân, 16 luồng)',1),('lenovo-legion-5-15ahp10','RAM','16GB DDR5-5600 (nâng tối đa 32GB)',2),('lenovo-legion-5-15ahp10','Ổ cứng','512GB SSD NVMe PCIe 4.0',3),('lenovo-legion-5-15ahp10','Card đồ hoạ','NVIDIA GeForce RTX 5050 8GB',4),('lenovo-legion-5-15ahp10','Màn hình','15.1 inch OLED 2560x1600, 165Hz',5),
  ('asus-vivobook-14-x1404va','CPU','Intel Core i3',1),('asus-vivobook-14-x1404va','RAM','8GB',2),('asus-vivobook-14-x1404va','Ổ cứng','512GB SSD',3),
  ('asus-gaming-vivobook-k3605vc','CPU','Intel Core i5',1),('asus-gaming-vivobook-k3605vc','Card đồ hoạ','Card rời',2),
  ('asus-tuf-gaming-f16-fx607vu','RAM','16GB',1),('asus-tuf-gaming-f16-fx607vu','Màn hình','16 inch',2),
  ('acer-aspire-5-a515-58m','CPU','Intel Core i5',1),('acer-aspire-5-a515-58m','Ổ cứng','512GB SSD',2),
  ('acer-swift-go-14-sfg14-41','CPU','AMD Ryzen 5 7430U',1),('acer-swift-go-14-sfg14-41','RAM','16GB LPDDR4X',2),('acer-swift-go-14-sfg14-41','Ổ cứng','1TB SSD',3),('acer-swift-go-14-sfg14-41','Màn hình','14 inch 1920x1200 IPS',4),('acer-swift-go-14-sfg14-41','Trọng lượng','Dưới 1,3 kg',5),
  ('acer-nitro-v-15','Màn hình','Tần số quét 180Hz',1),('acer-nitro-v-15','Card đồ hoạ','Card rời',2),
  ('sac-gan-65w','Công suất','65W tối đa',1),('sac-gan-65w','Cổng','2 USB-C, 1 USB-A',2),
  ('pin-20000mah-65w','Dung lượng','20.000mAh',1),('pin-20000mah-65w','Công suất','65W, sạc được laptop',2),
  ('hub-usbc-7-in-1','Cổng','HDMI 4K, 2 USB-A, khe SD/microSD, USB-C sạc 100W',1),
  ('loa-bluetooth-mini','Chống nước','IPX7',1),('loa-bluetooth-mini','Pin','Khoảng 12 giờ',2),
  ('tai-nghe-chup-tai-anc','Chống ồn','ANC chủ động',1),('tai-nghe-chup-tai-anc','Pin','Đến 40 giờ',2)
) AS v(slug, label, value, ord)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_specs x WHERE x.product_id = p.id);

-- Kiểm tra nhanh
SELECT c.name AS danh_muc, count(p.id) AS so_san_pham
FROM categories c
LEFT JOIN categories root ON root.id = COALESCE(c.parent_id, c.id)
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name, c.sort_order, c.id ORDER BY min(root.sort_order), c.sort_order;
SELECT count(*) AS tong_san_pham FROM products;
