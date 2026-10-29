// Gọi các API cần đăng nhập admin.
// Token (vé vào cửa) do backend cấp lúc đăng nhập, lưu ở localStorage, hết hạn sau 8 giờ.
// Lưu ý: cách an toàn hơn là cookie httpOnly; localStorage được chọn vì dễ hiểu khi mới học.
import { API_BASE, clearCache } from './api.js';

const KEY = 'dh-admin-token';

export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t) => { try { localStorage.setItem(KEY, t); } catch { /* bỏ qua */ } };
export const clearToken = () => { try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ } };

export class AuthError extends Error {}

// adminFetch('/api/admin/products', { method: 'PUT', body: {...} })
export async function adminFetch(path, { method = 'GET', body } = {}) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Không kết nối được máy chủ. Backend có thể đang khởi động, thử lại sau ít giây.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { clearToken(); throw new AuthError(data.error || 'Bạn cần đăng nhập lại'); }
  if (!res.ok) throw new Error(data.error || `Máy chủ trả lỗi ${res.status}`);

  // Admin vừa sửa dữ liệu thì xoá bộ nhớ đệm, để trang khách thấy ngay bản mới
  if (method !== 'GET') clearCache();
  return data;
}

// Upload ảnh thẳng lên Cloudinary. Trả về đường dẫn https của ảnh.
export async function uploadImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} không phải file ảnh`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} nặng hơn 5MB, hãy nén bớt`);

  // 1. Xin chữ ký từ backend (backend giữ API Secret)
  const sig = await adminFetch('/api/admin/upload-signature', { method: 'POST' });

  // 2. Gửi ảnh kèm chữ ký lên Cloudinary
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || 'Upload ảnh thất bại');
  return data.secure_url;
}

// Bỏ dấu tiếng Việt để tạo slug: "Sạc nhanh 35W" -> "sac-nhanh-35w"
export function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'warn' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  shipping: { label: 'Đang giao', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'ok' },
  cancelled: { label: 'Đã huỷ', tone: 'bad' },
};
