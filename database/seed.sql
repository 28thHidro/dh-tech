-- =====================================================================
-- DH tech - Dữ liệu mẫu. Chạy SAU schema.sql.
-- Giá niêm yết: theo giá chính hãng tại Việt Nam lúc mở bán.
-- Giảm giá, khuyến mãi, phụ kiện và tồn kho: dữ liệu mẫu.
-- =====================================================================

-- Danh mục
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Điện thoại', 'dien-thoai', 1),
  ('Phụ kiện',   'phu-kien',   2);

INSERT INTO categories (parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.ord
FROM categories c
JOIN (VALUES
  ('Sạc và cáp',     'sac-cap',  1),
  ('Ốp lưng',        'op-lung',  2),
  ('Kính cường lực', 'kinh',     3),
  ('Pin dự phòng',   'pin',      4),
  ('Tai nghe',       'tai-nghe', 5)
) AS v(name, slug, ord) ON c.slug = 'phu-kien';

-- Thương hiệu
INSERT INTO brands (name, slug) VALUES
  ('Apple',   'apple'),
  ('Samsung', 'samsung');

-- Sản phẩm
INSERT INTO products (category_id, brand_id, name, slug, short_desc, discount_amount, gift_text, is_hot)
SELECT c.id, b.id, v.name, v.slug, v.short_desc, v.discount, v.gift, v.hot
FROM (VALUES
  ('dien-thoai', 'apple',   'iPhone Duo',                'iphone-duo',        'iPhone màn hình gập đầu tiên',                    1500000, 'Tặng ốp lưng chính hãng khi đặt trước', TRUE),
  ('dien-thoai', 'apple',   'iPhone 18 Pro Max',         'iphone-18-pro-max', 'Màn hình 6.9 inch, pin xem video đến 43 giờ',     1200000, 'Thu cũ trợ giá đến 3 triệu',            TRUE),
  ('dien-thoai', 'apple',   'iPhone 18 Pro',             'iphone-18-pro',     'Nhỏ gọn 6.3 inch, chip A20 Pro',                  1000000, 'Thu cũ trợ giá đến 3 triệu',            FALSE),
  ('dien-thoai', 'samsung', 'Samsung Galaxy S26 Ultra',  'galaxy-s26-ultra',  'Camera 200MP, bút S Pen',                         5000000, 'Tặng sạc nhanh 45W',                    TRUE),
  ('dien-thoai', 'samsung', 'Samsung Galaxy S26+',       'galaxy-s26-plus',   'Màn hình lớn, pin 4900 mAh',                      3000000, 'Tặng ốp lưng và kính cường lực',        TRUE),
  ('dien-thoai', 'samsung', 'Samsung Galaxy S26',        'galaxy-s26',        'Nhỏ gọn 6.3 inch',                                3000000, 'Tặng ốp lưng và kính cường lực',        FALSE),
  ('sac-cap',    NULL,      'Củ sạc nhanh GaN 35W 2 cổng USB-C',            'sac-gan-35w',     'Sạc cùng lúc điện thoại và tai nghe', 200000, NULL, TRUE),
  ('sac-cap',    NULL,      'Cáp USB-C to USB-C 60W bện dù',                'cap-usbc-60w',    'Bền, chống gãy gập',                  100000, NULL, FALSE),
  ('op-lung',    NULL,      'Ốp lưng trong suốt MagSafe iPhone 18 Pro Max', 'op-magsafe-18pm', 'Chống ố vàng, hít nam châm chắc',     100000, NULL, FALSE),
  ('kinh',       NULL,      'Kính cường lực Galaxy S26 series',             'kinh-galaxy-s26', 'Phủ chống vân tay, dán kèm khung',    100000, NULL, FALSE),
  ('pin',        NULL,      'Pin dự phòng 10.000mAh sạc nhanh 20W',         'pin-10000mah',    'Mỏng nhẹ, mang lên máy bay được',     200000, NULL, TRUE),
  ('tai-nghe',   NULL,      'Tai nghe Bluetooth chống ồn ANC',              'tai-nghe-anc',    'Pin 30 giờ kèm hộp sạc',              400000, NULL, FALSE)
) AS v(cat, brand, name, slug, short_desc, discount, gift, hot)
JOIN categories c ON c.slug = v.cat
LEFT JOIN brands b ON b.slug = v.brand;

-- Phiên bản và giá niêm yết
INSERT INTO product_variants (product_id, name, list_price, sort_order)
SELECT p.id, v.name, v.price, v.ord
FROM (VALUES
  ('iphone-duo',        '256GB',  64990000, 1),
  ('iphone-duo',        '512GB',  71490000, 2),
  ('iphone-duo',        '1TB',    84490000, 3),
  ('iphone-duo',        '2TB',   103990000, 4),
  ('iphone-18-pro-max', '256GB',  41999000, 1),
  ('iphone-18-pro-max', '512GB',  48499000, 2),
  ('iphone-18-pro-max', '1TB',    61499000, 3),
  ('iphone-18-pro-max', '2TB',    80999000, 4),
  ('iphone-18-pro',     '256GB',  38999000, 1),
  ('iphone-18-pro',     '512GB',  45499000, 2),
  ('iphone-18-pro',     '1TB',    58499000, 3),
  ('iphone-18-pro',     '2TB',    77999000, 4),
  ('galaxy-s26-ultra',  '12GB · 256GB', 36990000, 1),
  ('galaxy-s26-ultra',  '12GB · 512GB', 42990000, 2),
  ('galaxy-s26-ultra',  '16GB · 1TB',   51990000, 3),
  ('galaxy-s26-plus',   '12GB · 256GB', 29990000, 1),
  ('galaxy-s26',        '12GB · 256GB', 25990000, 1),
  ('sac-gan-35w',       '35W',               790000, 1),
  ('cap-usbc-60w',      '1m',                290000, 1),
  ('cap-usbc-60w',      '2m',                350000, 2),
  ('op-magsafe-18pm',   'iPhone 18 Pro Max', 490000, 1),
  ('op-magsafe-18pm',   'iPhone 18 Pro',     490000, 2),
  ('kinh-galaxy-s26',   'S26 Ultra',         350000, 1),
  ('kinh-galaxy-s26',   'S26+',              300000, 2),
  ('kinh-galaxy-s26',   'S26',               300000, 3),
  ('pin-10000mah',      '10.000mAh',         690000, 1),
  ('tai-nghe-anc',      'Bản tiêu chuẩn',   1290000, 1)
) AS v(slug, name, price, ord)
JOIN products p ON p.slug = v.slug;

-- Màu sắc
INSERT INTO product_colors (product_id, name, hex, sort_order)
SELECT p.id, v.name, v.hex, v.ord
FROM (VALUES
  ('iphone-duo',        'Trời Đêm',      '#1B2333', 1),
  ('iphone-duo',        'Trắng Ánh Sao', '#E9E4DA', 2),
  ('iphone-18-pro-max', 'Đen',           '#1C1D20', 1),
  ('iphone-18-pro-max', 'Bạc',           '#D9DBDE', 2),
  ('iphone-18-pro-max', 'Xanh Băng',     '#BFD8E6', 3),
  ('iphone-18-pro-max', 'Đỏ Burgundy',   '#5A1F2B', 4),
  ('iphone-18-pro',     'Đen',           '#1C1D20', 1),
  ('iphone-18-pro',     'Bạc',           '#D9DBDE', 2),
  ('iphone-18-pro',     'Xanh Băng',     '#BFD8E6', 3),
  ('iphone-18-pro',     'Đỏ Burgundy',   '#5A1F2B', 4),
  ('galaxy-s26-ultra',  'Đen Titan',     '#22252B', 1),
  ('galaxy-s26-ultra',  'Xám Titan',     '#7C8088', 2),
  ('galaxy-s26-ultra',  'Bạc Titan',     '#C9CCD1', 3),
  ('galaxy-s26-plus',   'Đen',           '#20232A', 1),
  ('galaxy-s26-plus',   'Xanh Navy',     '#24324D', 2),
  ('galaxy-s26-plus',   'Bạc',           '#CDD0D5', 3),
  ('galaxy-s26',        'Đen',           '#20232A', 1),
  ('galaxy-s26',        'Xanh Navy',     '#24324D', 2),
  ('galaxy-s26',        'Bạc',           '#CDD0D5', 3),
  ('sac-gan-35w',       'Trắng',         '#F1F2F4', 1),
  ('sac-gan-35w',       'Đen',           '#24272D', 2),
  ('cap-usbc-60w',      'Đen',           '#24272D', 1),
  ('cap-usbc-60w',      'Trắng',         '#F1F2F4', 2),
  ('op-magsafe-18pm',   'Trong suốt',    '#DCE6F2', 1),
  ('kinh-galaxy-s26',   'Trong suốt',    '#DCE6F2', 1),
  ('pin-10000mah',      'Đen',           '#24272D', 1),
  ('pin-10000mah',      'Trắng',         '#F1F2F4', 2),
  ('tai-nghe-anc',      'Trắng',         '#F1F2F4', 1),
  ('tai-nghe-anc',      'Đen',           '#24272D', 2)
) AS v(slug, name, hex, ord)
JOIN products p ON p.slug = v.slug;

-- SKU: tự sinh mọi tổ hợp phiên bản x màu của từng sản phẩm, mỗi SKU 10 máy.
-- Mã SKU dạng: IPHONE-18-PRO-V1-C2 (phiên bản số 1, màu số 2)
INSERT INTO product_skus (product_id, variant_id, color_id, sku_code, stock)
SELECT p.id, v.id, c.id,
       upper(p.slug) || '-V' || v.sort_order || '-C' || c.sort_order,
       10
FROM products p
JOIN product_variants v ON v.product_id = p.id
JOIN product_colors   c ON c.product_id = p.id;

-- Ví dụ thực tế: iPhone 18 Pro 256GB màu Bạc đã hết hàng, màu Đen chỉ còn 2 máy
UPDATE product_skus s SET stock = 0
FROM product_variants v, product_colors c
WHERE s.variant_id = v.id AND s.color_id = c.id
  AND s.sku_code LIKE 'IPHONE-18-PRO-V%' AND v.name = '256GB' AND c.name = 'Bạc';

UPDATE product_skus s SET stock = 2
FROM product_variants v, product_colors c
WHERE s.variant_id = v.id AND s.color_id = c.id
  AND s.sku_code LIKE 'IPHONE-18-PRO-V%' AND v.name = '256GB' AND c.name = 'Đen';

-- Thông số kỹ thuật
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT p.id, v.label, v.value, v.ord
FROM (VALUES
  ('iphone-duo',        'Kiểu máy',            'Gập dạng sách, 2 màn hình', 1),
  ('iphone-duo',        'Dung lượng',          '256GB / 512GB / 1TB / 2TB', 2),
  ('iphone-duo',        'Mở bán tại Việt Nam', '23/10/2026', 3),
  ('iphone-18-pro-max', 'Màn hình',       '6.9 inch', 1),
  ('iphone-18-pro-max', 'Chip',           'Apple A20 Pro', 2),
  ('iphone-18-pro-max', 'Camera',         'Hệ thống 48MP Pro Fusion, khẩu độ thay đổi', 3),
  ('iphone-18-pro-max', 'Tản nhiệt',      'Buồng hơi thế hệ mới', 4),
  ('iphone-18-pro-max', 'Thời lượng pin', 'Xem video đến 43 giờ', 5),
  ('iphone-18-pro',     'Màn hình',       '6.3 inch', 1),
  ('iphone-18-pro',     'Chip',           'Apple A20 Pro', 2),
  ('iphone-18-pro',     'Camera',         'Hệ thống 48MP Pro Fusion, khẩu độ thay đổi', 3),
  ('iphone-18-pro',     'Tản nhiệt',      'Buồng hơi thế hệ mới', 4),
  ('galaxy-s26-ultra',  'Màn hình',       '6.9 inch QHD+', 1),
  ('galaxy-s26-ultra',  'Chip',           'Snapdragon 8 Elite Gen 5 for Galaxy', 2),
  ('galaxy-s26-ultra',  'Camera sau',     '200MP chính, 50MP góc siêu rộng, 50MP tele 5x, 10MP tele 3x', 3),
  ('galaxy-s26-ultra',  'Pin',            '5000 mAh, sạc nhanh 60W, sạc không dây 25W', 4),
  ('galaxy-s26-ultra',  'Hệ điều hành',   'One UI 8.5, Android 16', 5),
  ('galaxy-s26-plus',   'Pin',            '4900 mAh, sạc nhanh 45W, sạc không dây 25W', 1),
  ('galaxy-s26-plus',   'Hệ điều hành',   'One UI 8.5, Android 16', 2),
  ('galaxy-s26-plus',   'Galaxy AI',      'Thế hệ thứ 3', 3),
  ('galaxy-s26',        'Màn hình',       '6.3 inch', 1),
  ('galaxy-s26',        'Pin',            '4300 mAh, sạc nhanh 25W, sạc không dây 25W', 2),
  ('galaxy-s26',        'Hệ điều hành',   'One UI 8.5, Android 16', 3),
  ('sac-gan-35w',       'Công suất',      '35W tối đa', 1),
  ('sac-gan-35w',       'Cổng',           '2 cổng USB-C', 2),
  ('sac-gan-35w',       'Công nghệ',      'GaN, nhỏ gọn, ít nóng', 3),
  ('cap-usbc-60w',      'Công suất',      '60W', 1),
  ('cap-usbc-60w',      'Chất liệu',      'Vỏ bện dù', 2),
  ('op-magsafe-18pm',   'Tương thích',    'iPhone 18 Pro, iPhone 18 Pro Max', 1),
  ('op-magsafe-18pm',   'Sạc không dây',  'Hỗ trợ MagSafe', 2),
  ('kinh-galaxy-s26',   'Độ cứng',        '9H', 1),
  ('kinh-galaxy-s26',   'Lớp phủ',        'Chống vân tay', 2),
  ('pin-10000mah',      'Dung lượng',     '10.000mAh', 1),
  ('pin-10000mah',      'Sạc nhanh',      '20W PD', 2),
  ('pin-10000mah',      'Cổng',           '1 USB-C, 1 USB-A', 3),
  ('tai-nghe-anc',      'Chống ồn',       'ANC chủ động', 1),
  ('tai-nghe-anc',      'Thời lượng pin', 'Đến 30 giờ kèm hộp sạc', 2),
  ('tai-nghe-anc',      'Kết nối',        'Bluetooth 5.3', 3)
) AS v(slug, label, value, ord)
JOIN products p ON p.slug = v.slug;

-- Kiểm tra nhanh: số dòng trong từng bảng
SELECT 'categories' AS bang, count(*) FROM categories
UNION ALL SELECT 'brands',           count(*) FROM brands
UNION ALL SELECT 'products',         count(*) FROM products
UNION ALL SELECT 'product_variants', count(*) FROM product_variants
UNION ALL SELECT 'product_colors',   count(*) FROM product_colors
UNION ALL SELECT 'product_skus',     count(*) FROM product_skus
UNION ALL SELECT 'product_specs',    count(*) FROM product_specs;
