import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { CartProvider } from './lib/cart.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductPage from './pages/ProductPage.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles.css';

// Bản đồ đường dẫn của website
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="danh-muc/:slug" element={<ProductList mode="category" />} />
            <Route path="tim-kiem" element={<ProductList mode="search" />} />
            <Route path="san-pham/:slug" element={<ProductPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);
