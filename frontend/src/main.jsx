import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { CartProvider } from './lib/cart.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductPage from './pages/ProductPage.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles.css';

// Trang quản trị chỉ tải khi có người mở /admin (lazy).
// Khách mua hàng không phải tải phần code này, nên website nhẹ và nhanh hơn.
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./admin/Login.jsx'));
const AdminProducts = lazy(() => import('./admin/Products.jsx'));
const AdminProductForm = lazy(() => import('./admin/ProductForm.jsx'));
const AdminOrders = lazy(() => import('./admin/Orders.jsx'));

const loading = <div style={{ padding: 40, color: 'var(--muted)' }}>Đang tải…</div>;

// Bản đồ đường dẫn của website
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Suspense fallback={loading}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="danh-muc/:slug" element={<ProductList mode="category" />} />
              <Route path="tim-kiem" element={<ProductList mode="search" />} />
              <Route path="san-pham/:slug" element={<ProductPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="admin/dang-nhap" element={<AdminLogin />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminProducts />} />
              <Route path="san-pham/moi" element={<AdminProductForm />} />
              <Route path="san-pham/:id" element={<AdminProductForm />} />
              <Route path="don-hang" element={<AdminOrders />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);
