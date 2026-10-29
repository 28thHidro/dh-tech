// Kiểm tra người gọi API có phải admin đã đăng nhập không.
// Frontend gửi kèm header:  Authorization: Bearer <token>
import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Bạn cần đăng nhập' });

  try {
    // verify kiểm tra chữ ký (token có bị sửa không) và hạn dùng (còn hiệu lực không)
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
}
