import { useMemo } from 'react';
import { artKind, artSvg } from '../lib/art.js';

// Ảnh sản phẩm: có ảnh thật (từ database) thì dùng, chưa có thì vẽ hình minh hoạ.
export default function ProductArt({ product, color, image, className = 'art' }) {
  const svg = useMemo(
    () => artSvg(artKind(product), color || product.colors?.[0]?.hex, product.brand_slug === 'apple'),
    [product, color]
  );

  if (image) {
    return (
      <div className={className}>
        <img src={image} alt={product.name} loading="lazy" />
      </div>
    );
  }
  // SVG do chính mình sinh ra từ dữ liệu đã kiểm tra, nên chèn trực tiếp được.
  return <div className={className} role="img" aria-label={product.name} dangerouslySetInnerHTML={{ __html: svg }} />;
}
