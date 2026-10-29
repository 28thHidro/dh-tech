import { useMemo } from 'react';
import { artKind, artSvg } from '../lib/art.js';
import { cdn } from '../lib/api.js';

// Ảnh sản phẩm: có ảnh thật (admin upload lên Cloudinary) thì dùng, chưa có thì vẽ hình minh hoạ.
export default function ProductArt({ product, color, image, width = 600, className = 'art' }) {
  const svg = useMemo(
    () => (image ? '' : artSvg(artKind(product), color || product.colors?.[0]?.hex || product.hex, product.brand_slug === 'apple')),
    [product, color, image]
  );

  if (image) {
    return (
      <div className={className}>
        <img src={cdn(image, width)} alt={product.name} loading="lazy" decoding="async" />
      </div>
    );
  }
  // SVG do chính mình sinh ra từ dữ liệu đã kiểm tra, nên chèn trực tiếp được.
  return <div className={className} role="img" aria-label={product.name} dangerouslySetInnerHTML={{ __html: svg }} />;
}
