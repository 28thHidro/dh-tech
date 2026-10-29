// Giỏ hàng dùng chung cho cả website (React Context).
// Lưu trong localStorage của trình duyệt, nên tải lại trang vẫn còn.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const CartContext = createContext(null);
// Đổi tên khoá khi cấu trúc giỏ thay đổi (v3 thêm skuId để đặt hàng thật), giỏ cũ sẽ bị bỏ qua
const KEY = 'dh-cart-v3';

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(items) ? items.filter((i) => Number.isInteger(i?.skuId)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef();

  // Mỗi khi giỏ thay đổi thì lưu lại
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* trình duyệt chặn bộ nhớ: bỏ qua */ }
  }, [items]);

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // item: { skuId, image, slug, name, brand_slug, category, variantId, variantName, colorId, colorName, hex, price, listPrice }
  const add = useCallback((item) => {
    const key = `${item.slug}|${item.variantId}|${item.colorId}`;
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...item, key, qty: 1 }];
    });
    notify(`Đã thêm ${item.name} vào giỏ`);
  }, [notify]);

  const setQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)));
  }, []);

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    add, setQty, remove, clear,
    open, setOpen,
    toast, notify,
  }), [items, add, setQty, remove, clear, open, toast, notify]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
