// Gọi backend DH tech.
// Trên máy: VITE_API_URL để trống, Vite proxy /api sang http://localhost:3000.
// Trên mạng: VITE_API_URL là địa chỉ backend trên Render.
import { useCallback, useEffect, useState } from 'react';

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Bộ nhớ đệm nhỏ: cùng một đường dẫn trong 60 giây thì dùng lại kết quả cũ,
// đỡ gọi server nhiều lần khi người dùng chuyển qua lại giữa các trang.
const cache = new Map();
const TTL = 60_000;
export const clearCache = () => cache.clear();

const NETWORK_ERROR = 'Không kết nối được máy chủ. Nếu vừa mở trang, máy chủ có thể đang khởi động, hãy thử lại sau ít giây.';

async function readJSON(res) {
  // Địa chỉ API sai thường trả về trang HTML thay vì JSON, báo lỗi rõ ràng thay vì im lặng
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Không tìm thấy máy chủ API. Kiểm tra lại địa chỉ backend (VITE_API_URL).');
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Máy chủ trả lỗi ${res.status}`);
  return body;
}

export async function getJSON(path, { signal } = {}) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  let res;
  try {
    res = await fetch(API_BASE + path, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(NETWORK_ERROR);
  }
  const body = await readJSON(res);
  cache.set(path, { data: body, at: Date.now() });
  return body;
}

export async function postJSON(path, data) {
  let res;
  try {
    res = await fetch(API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  return readJSON(res);
}

// Ảnh Cloudinary: nhờ Cloudinary xử lý ảnh trước khi gửi về trình duyệt (ảnh gốc giữ nguyên):
//   e_trim       cắt bỏ viền trắng / trong suốt thừa quanh sản phẩm
//   c_pad (1)    đặt sản phẩm vào giữa khung vuông nhỏ hơn một chút
//   c_pad (2)    thêm lề trắng đều 4 cạnh -> mọi ảnh cùng cỡ, cùng vị trí dù cắt tay lệch nhau
//   f_auto,q_auto  tự chọn định dạng và chất lượng nhẹ nhất
export const cdn = (url, width = 600) => {
  if (!url?.includes('/upload/')) return url;
  const inner = Math.round(width * 0.9);
  const steps = `e_trim:10/c_pad,w_${inner},h_${inner},b_white/c_pad,w_${width},h_${width},b_white/f_auto,q_auto`;
  return url.replace('/upload/', `/upload/${steps}/`);
};

// Hook dùng trong component: const { data, error, loading, reload } = useApi('/api/products')
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Không có đường dẫn (ví dụ ô tìm kiếm trống) thì không gọi API
    if (!path) { setState({ data: null, error: null, loading: false }); return; }
    const ctrl = new AbortController();
    setState((s) => ({ data: s.data, error: null, loading: true }));
    getJSON(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false });
      });
    // Rời trang trước khi dữ liệu về thì huỷ request, tránh cập nhật nhầm trang mới
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => {
    cache.delete(path);
    setNonce((n) => n + 1);
  }, [path]);

  return { ...state, reload };
}
