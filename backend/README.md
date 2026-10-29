# backend

API của DH tech, viết bằng Node.js + Express, kết nối PostgreSQL trên Neon.

## Chạy trên máy

```powershell
cd backend
npm install            # cài thư viện (chỉ cần làm lần đầu)
copy .env.example .env # tạo file .env, rồi mở ra dán DATABASE_URL thật của Neon
npm run dev            # chạy server, tự khởi động lại mỗi khi sửa code
```

Mở trình duyệt: http://localhost:3000/api/health

## Cấu trúc

```
backend/
├── src/
│   ├── server.js            Khởi động Express, gắn các route, xử lý lỗi
│   ├── db.js                Kết nối PostgreSQL (pool)
│   ├── middleware/auth.js   Chặn API admin nếu chưa đăng nhập
│   └── routes/
│       ├── products.js      /api/products
│       ├── categories.js    /api/categories
│       ├── orders.js        /api/orders
│       ├── auth.js          /api/auth
│       └── admin.js         /api/admin/...
├── scripts/create-admin.js  Tạo tài khoản admin
├── .env.example             Mẫu biến môi trường (file .env thật không commit)
└── package.json
```

## API

| Method | Đường dẫn | Mô tả | Trạng thái |
|---|---|---|---|
| GET | `/api/health` | Kiểm tra server và database | ✅ |
| GET | `/api/products` | Danh sách sản phẩm | ✅ |
| GET | `/api/products/:slug` | Chi tiết: phiên bản, màu, tồn kho theo SKU, thông số | ✅ |
| GET | `/api/categories` | Cây danh mục | ✅ |
| POST | `/api/orders` | Khách đặt hàng, trừ kho trong transaction | ✅ |
| POST | `/api/auth/login` | Admin đăng nhập, trả về JWT | ✅ |
| GET | `/api/auth/me` | Kiểm tra token | ✅ |
| GET / POST / PUT / DELETE | `/api/admin/products` | Quản lý sản phẩm (cần JWT) | ✅ |
| GET / PATCH | `/api/admin/orders` | Xem đơn, đổi trạng thái; huỷ đơn thì trả hàng về kho (cần JWT) | ✅ |
| POST | `/api/admin/upload-signature` | Chữ ký để upload ảnh thẳng lên Cloudinary (cần JWT) | ✅ |

## Tạo tài khoản admin

```powershell
npm run create-admin -- admin "mat-khau-it-nhat-10-ky-tu"
```

Chạy lại với cùng tên đăng nhập để đổi mật khẩu.

### Tham số của `GET /api/products`

| Tham số | Ví dụ | Ý nghĩa |
|---|---|---|
| `category` | `phu-kien` | Lọc theo danh mục, gồm cả danh mục con |
| `brand` | `apple` | Lọc theo thương hiệu |
| `q` | `s26` | Tìm theo tên hoặc mô tả |
| `hot` | `true` | Chỉ lấy sản phẩm Hot sale |
| `sort` | `price_asc` | `featured`, `price_asc`, `price_desc`, `newest` |

Ví dụ: `/api/products?category=phu-kien&sort=price_asc`
