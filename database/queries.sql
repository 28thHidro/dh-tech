-- =====================================================================
-- DH tech - Các câu truy vấn mẫu để luyện tập.
-- Bôi đen từng câu rồi chạy trong Neon SQL Editor.
-- Bước 3, backend sẽ dùng những câu gần giống thế này.
-- =====================================================================

-- 1. Danh sách sản phẩm cho trang chủ: giá thấp nhất và giá sau giảm
SELECT p.slug, p.name, b.name AS brand,
       MIN(v.list_price)                     AS gia_niem_yet_tu,
       MIN(v.list_price) - p.discount_amount AS gia_dh_tu,
       p.is_hot
FROM products p
LEFT JOIN brands b      ON b.id = p.brand_id
JOIN product_variants v ON v.product_id = p.id
WHERE p.is_active
GROUP BY p.id, b.name
ORDER BY p.id;

-- 2. Chi tiết một sản phẩm: các phiên bản và giá
SELECT v.name AS phien_ban, v.list_price, v.list_price - p.discount_amount AS gia_dh
FROM products p
JOIN product_variants v ON v.product_id = p.id
WHERE p.slug = 'iphone-18-pro'
ORDER BY v.sort_order;

-- 3. Tồn kho từng màu của iPhone 18 Pro 256GB (thấy màu Bạc đã hết)
SELECT c.name AS mau, s.sku_code, s.stock,
       CASE WHEN s.stock = 0 THEN 'Hết hàng'
            WHEN s.stock < 3 THEN 'Sắp hết'
            ELSE 'Còn hàng' END AS trang_thai
FROM product_skus s
JOIN product_variants v ON v.id = s.variant_id
JOIN product_colors   c ON c.id = s.color_id
JOIN products         p ON p.id = s.product_id
WHERE p.slug = 'iphone-18-pro' AND v.name = '256GB'
ORDER BY c.sort_order;

-- 4. Sản phẩm thuộc danh mục Phụ kiện (gồm cả danh mục con)
SELECT p.name, c.name AS danh_muc
FROM products p
JOIN categories c      ON c.id = p.category_id
LEFT JOIN categories g ON g.id = c.parent_id
WHERE c.slug = 'phu-kien' OR g.slug = 'phu-kien';

-- 5. Tổng giá trị hàng tồn kho theo thương hiệu (theo giá niêm yết)
SELECT COALESCE(b.name, 'Phụ kiện khác') AS thuong_hieu,
       SUM(s.stock)                AS so_may,
       SUM(s.stock * v.list_price) AS gia_tri
FROM product_skus s
JOIN product_variants v ON v.id = s.variant_id
JOIN products p         ON p.id = s.product_id
LEFT JOIN brands b      ON b.id = p.brand_id
GROUP BY b.name
ORDER BY gia_tri DESC;
