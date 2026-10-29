// Gọi backend DH tech.
// Trên máy: VITE_API_URL để trống, Vite proxy /api sang http://localhost:3000.
// Trên mạng: VITE_API_URL là địa chỉ backend trên Render (Bước 6).
import { useCallback, useEffect, useState } from 'react';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Bộ nhớ đệm nhỏ: cùng một đường dẫn trong 60 giây thì dùng lại kết quả cũ,
// đỡ gọi server nhiều lần khi người dùng chuyển qua lại giữa các trang.
const cache = new Map();
const TTL = 60_000;

export async function getJSON(path, { signal } = {}) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  let res;
  try {
    res = await fetch(BASE + path, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Máy chủ trả lỗi ${res.status}`);

  cache.set(path, { data: body, at: Date.now() });
  return body;
}

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
