// Kiểm tra người gọi API đã đăng nhập chưa.
// Frontend gửi kèm header:  Authorization: Bearer <token>
//
// Có HAI loại token, phân biệt bằng "audience" (aud) ghi bên trong token:
//   aud = 'admin'     do /api/auth/login cấp, dùng cho trang quản trị
//   aud = 'customer'  do /api/account/login cấp, dùng cho khách hàng
// Nhờ vậy token của khách KHÔNG BAO GIỜ dùng được để vào API quản trị, dù cùng một khoá ký.
import jwt from 'jsonwebtoken';

const readToken = (req) => {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export const signAdmin = (admin) => jwt.sign(admin, process.env.JWT_SECRET, { audience: 'admin', expiresIn: '8h' });
export const signCustomer = (c, remember) =>
  jwt.sign({ id: c.id, name: c.full_name }, process.env.JWT_SECRET, { audience: 'customer', expiresIn: remember ? '30d' : '1d' });

export function requireAdmin(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Bạn cần đăng nhập' });
  try {
    // verify kiểm tra chữ ký (token có bị sửa không), hạn dùng, và đúng loại token admin
    req.admin = jwt.verify(token, process.env.JWT_SECRET, { audience: 'admin' });
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
}

export function requireCustomer(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Bạn cần đăng nhập' });
  try {
    req.customer = jwt.verify(token, process.env.JWT_SECRET, { audience: 'customer' });
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
}

// Có token khách hợp lệ thì gắn req.customer, không có thì vẫn cho qua (mua không cần đăng nhập)
export function optionalCustomer(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.customer = jwt.verify(token, process.env.JWT_SECRET, { audience: 'customer' }); } catch { /* bỏ qua token hỏng */ }
  }
  next();
}
