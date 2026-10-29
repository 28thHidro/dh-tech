# dh-tech

DH tech - website bán điện thoại và phụ kiện (React + Node.js)

> Công nghệ đến gần bạn hơn.

🌐 **Website:** https://dh-tech-frontend.vercel.app

## Cấu trúc thư mục

```
dh-tech/
├── frontend/          Giao diện website (khách hàng và trang admin)
│   ├── index.html     Bản giao diện đầu tiên (prototype)
│   └── assets/        Logo và hình ảnh dùng trên web
├── backend/           API Node.js + Express (làm ở bước 3)
└── brand/             File nhận diện thương hiệu gốc
```

## Xem thử giao diện

Mở file `frontend/index.html` bằng trình duyệt (Chrome, Edge).

Trong VS Code có thể cài extension **Live Server**, bấm chuột phải vào `index.html` → **Open with Live Server** để trang tự tải lại mỗi khi sửa code.

## Lộ trình

- [x] Bước 1: Giao diện prototype theo bộ nhận diện DH tech
- [ ] Bước 2: Thiết kế database (ERD + SQL), dùng PostgreSQL trên Neon
- [ ] Bước 3: Backend API cho khách (danh sách, chi tiết sản phẩm)
- [ ] Bước 4: Nối giao diện với API thật
- [ ] Bước 5: Trang admin: đăng nhập JWT, thêm/sửa/xoá sản phẩm, upload ảnh
- [ ] Bước 6: Deploy (Vercel + Render + Neon) và gắn tên miền

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | HTML/CSS/JS → React + Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon) |
| Lưu ảnh | Cloudinary |
| Deploy | Vercel (frontend), Render (backend) |

## Ghi chú

Giá niêm yết lấy theo giá chính hãng tại Việt Nam lúc mở bán. Giá DH tech, khuyến mãi và phụ kiện hiện là dữ liệu mẫu.
