# frontend

Website DH tech, viết bằng React + Vite, đọc dữ liệu từ backend.

## Chạy trên máy

Cần chạy **backend trước** (terminal 1), rồi frontend (terminal 2):

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm install     # chỉ cần lần đầu
npm run dev
```

Mở http://localhost:5173

## Cấu trúc

```
frontend/
├── index.html               Trang HTML gốc, React gắn vào <div id="root">
├── vite.config.js           Cấu hình Vite, chuyển /api sang backend cổng 3000
├── vercel.json              Cho Vercel biết mọi đường dẫn đều mở index.html
├── assets/dh-tech-logo.png  Logo gốc (đã tách nền)
└── src/
    ├── main.jsx             Điểm khởi động, bản đồ đường dẫn (routes)
    ├── styles.css           Toàn bộ giao diện
    ├── lib/
    │   ├── api.js           Gọi backend + hook useApi
    │   ├── cart.jsx         Giỏ hàng dùng chung (React Context)
    │   ├── format.js        Định dạng tiền
    │   └── art.js           Hình minh hoạ tạm khi chưa có ảnh thật
    ├── components/          Các mảnh giao diện dùng lại
    └── pages/               Mỗi file là một trang
```

## Đường dẫn

| URL | Trang |
|---|---|
| `/` | Trang chủ |
| `/danh-muc/dien-thoai?brand=apple` | Danh mục, lọc theo hãng |
| `/danh-muc/phu-kien?price=u1&sort=price_asc` | Danh mục, lọc giá, sắp xếp |
| `/tim-kiem?q=s26` | Tìm kiếm |
| `/san-pham/iphone-18-pro` | Chi tiết sản phẩm |
