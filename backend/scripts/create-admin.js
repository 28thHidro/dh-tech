// Tạo hoặc đổi mật khẩu tài khoản admin.
// Cách dùng (trong thư mục backend):
//   npm run create-admin -- ten-dang-nhap "mat-khau-cua-ban"
//
// Mật khẩu được băm bằng bcrypt trước khi lưu. Database không bao giờ chứa mật khẩu thật.
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error('Cách dùng: npm run create-admin -- <ten-dang-nhap> "<mat-khau>"');
  process.exit(1);
}
if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
  console.error('Tên đăng nhập 3-50 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới, gạch ngang.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Mật khẩu cần ít nhất 10 ký tự.');
  process.exit(1);
}

// Số 12 là "độ khó": càng cao càng chậm, kẻ xấu dò mật khẩu càng mất thời gian
const hash = await bcrypt.hash(password, 12);
const { rows } = await pool.query(
  `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
   ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
   RETURNING id, (xmax = 0) AS created`,
  [username, hash]
);
console.log(rows[0].created ? `Đã tạo tài khoản admin "${username}".` : `Đã đổi mật khẩu cho "${username}".`);
await pool.end();
