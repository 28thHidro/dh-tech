// Tài khoản khách hàng dùng chung cho cả website: ai đang đăng nhập, đăng nhập, đăng xuất.
// Token lưu ở localStorage nếu chọn "Ghi nhớ đăng nhập", ngược lại ở sessionStorage (đóng trình duyệt là mất).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from './api.js';

const KEY = 'dh-customer-token';
const Ctx = createContext(null);

const store = {
  get() { try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY); } catch { return null; } },
  set(token, remember) {
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, token);
      (remember ? sessionStorage : localStorage).removeItem(KEY);
    } catch { /* trình duyệt chặn lưu trữ thì chỉ đăng nhập trong lượt này */ }
  },
  clear() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ } },
};

// Gọi API có kèm token khách (nếu có)
export async function accountFetch(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = store.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Không kết nối được máy chủ. Thử lại sau ít giây.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) store.clear();
  if (!res.ok) {
    const err = new Error(data.error || `Máy chủ trả lỗi ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!store.get());

  // Mở web mà còn token thì hỏi server xem token còn dùng được không
  useEffect(() => {
    if (!store.get()) return;
    accountFetch('/api/account/me')
      .then((d) => setUser(d.customer))
      .catch(() => { store.clear(); setUser(null); })
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback((token, customer, remember) => { store.set(token, remember); setUser(customer); }, []);
  const signOut = useCallback(() => { store.clear(); setUser(null); }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAccount = () => useContext(Ctx);

// Chữ cái đầu của tên (tên tiếng Việt: lấy chữ cuối, ví dụ "Phạm Duy Hải" -> "H")
export const initial = (name = '') => (name.trim().split(/\s+/).pop() || '?').charAt(0).toUpperCase();
