import { useEffect } from 'react';

// Hiện dần các phần tử có class "reveal" khi cuộn tới (thêm class "in").
// deps: chạy lại khi nội dung mới được vẽ ra (ví dụ dữ liệu vừa tải xong).
export function useReveal(deps) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.reveal:not(.in)')];
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
