// Chống dò mật khẩu / tạo tài khoản hàng loạt: đếm số lần theo địa chỉ IP.
// Lưu trong bộ nhớ, đủ dùng cho một server. Hệ thống lớn sẽ dùng Redis.
export function createLimiter({ max, windowMs }) {
  const hits = new Map();
  return {
    // Còn bao nhiêu phút bị khoá (0 = chưa bị khoá)
    blockedMinutes(ip) {
      const r = hits.get(ip);
      if (r && r.count >= max && Date.now() < r.until) return Math.ceil((r.until - Date.now()) / 60000);
      return 0;
    },
    hit(ip) {
      const r = hits.get(ip) ?? { count: 0, until: 0 };
      r.count = Date.now() > r.until ? 1 : r.count + 1;
      r.until = Date.now() + windowMs;
      hits.set(ip, r);
    },
    reset(ip) { hits.delete(ip); },
  };
}
