// Kết nối tới PostgreSQL (Neon).
// Chuỗi kết nối lấy từ biến môi trường DATABASE_URL (file .env), không bao giờ viết thẳng vào code.
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL. Hãy tạo file backend/.env theo mẫu .env.example');
  process.exit(1);
}

// PostgreSQL trả kiểu BIGINT (mã 20) về dạng chuỗi "64990000" để tránh tràn số.
// Giá tiền VNĐ của mình nhỏ hơn nhiều so với giới hạn của Number trong JavaScript,
// nên đổi sang số để frontend tính toán được luôn.
pg.types.setTypeParser(20, (value) => Number(value));

// Pool giữ sẵn vài kết nối để dùng lại, nhanh hơn mở kết nối mới cho mỗi request.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
