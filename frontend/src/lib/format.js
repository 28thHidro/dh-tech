// Định dạng tiền Việt: 37999000 -> "37.999.000đ"
export const vnd = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

// Phần trăm giảm giá, làm tròn
export const percentOff = (listPrice, discount) =>
  listPrice > 0 ? Math.round((discount / listPrice) * 100) : 0;

// Rút gọn tên phiên bản trên thẻ sản phẩm: "12GB · 256GB" -> "256GB"
export const shortVariant = (name) => name.replace(/^\d+GB · /, '');
