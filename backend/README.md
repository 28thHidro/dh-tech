# backend

API của DH tech, viết bằng Node.js + Express. Sẽ được dựng ở Bước 3.

Các API dự kiến:

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm, lọc theo hãng, danh mục, giá |
| GET | `/api/products/:slug` | Chi tiết một sản phẩm, kèm phiên bản, màu, thông số |
| POST | `/api/auth/login` | Admin đăng nhập, trả về JWT |
| POST | `/api/admin/products` | Thêm sản phẩm (cần JWT) |
| PUT | `/api/admin/products/:id` | Sửa sản phẩm (cần JWT) |
| DELETE | `/api/admin/products/:id` | Xoá sản phẩm (cần JWT) |
| POST | `/api/admin/upload` | Upload ảnh lên Cloudinary (cần JWT) |
