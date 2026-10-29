// Hình minh hoạ cửa hàng DH tech (vẽ bằng SVG). Bảng hiệu dùng đúng file logo gốc, không vẽ lại.
import logo from '../../assets/dh-tech-logo.png';

const INK = '#141414';
const ORANGE = '#F28C28';
const CREAM = '#FFF3E4';

export default function Storefront({ className = '' }) {
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg className={`storefront ${className}`} viewBox="0 0 360 250" role="img" aria-label="Cửa hàng DH tech">
      {/* Vỉa hè */}
      <rect x="0" y="236" width="360" height="14" rx="3" fill="#3A3631" />
      {/* Toà nhà */}
      <rect x="20" y="36" width="320" height="202" rx="8" fill="#2B2825" stroke={INK} strokeWidth="5" />
      {/* Bảng hiệu: logo gốc giữ nguyên tỉ lệ */}
      <rect x="62" y="46" width="236" height="44" rx="8" fill={INK} />
      <image href={logo} x="96" y="51" width="168" height="34" preserveAspectRatio="xMidYMid meet" />
      {/* Mái hiên sọc cam - kem */}
      {stripes.map((i) => (
        <g key={i}>
          <rect x={20 + i * 40} y="98" width="40" height="22" fill={i % 2 ? CREAM : ORANGE} />
          <path d={`M${20 + i * 40} 120a20 13 0 0 0 40 0z`} fill={i % 2 ? CREAM : ORANGE} />
        </g>
      ))}
      <path d="M20 98h320" stroke={INK} strokeWidth="5" />
      <path d="M20 120h320" stroke={INK} strokeWidth="2" opacity=".25" />

      {/* Tủ kính trưng bày */}
      <rect x="38" y="142" width="156" height="90" rx="6" fill="#BFDCE6" stroke={INK} strokeWidth="5" />
      <rect x="44" y="204" width="144" height="8" rx="2" fill="#8FB7C4" />
      {[60, 92, 124, 156].map((x, i) => (
        <g key={x}>
          <rect x={x} y={i % 2 ? 166 : 160} width="20" height={i % 2 ? 38 : 44} rx="5" fill={INK} />
          <rect x={x + 3} y={(i % 2 ? 166 : 160) + 4} width="14" height={i % 2 ? 28 : 34} rx="2" fill={i % 2 ? ORANGE : CREAM} />
        </g>
      ))}
      <path d="M52 150l26 30M150 150l34 40" stroke="#fff" strokeWidth="5" opacity=".35" strokeLinecap="round" />
      {/* Bảng giảm giá trong tủ kính */}
      <rect x="140" y="148" width="46" height="18" rx="4" fill={ORANGE} stroke={INK} strokeWidth="2.5" />
      <text x="163" y="161" textAnchor="middle" fontSize="10" fontWeight="700" fill={INK} fontFamily="Roboto, Arial, sans-serif">-50%</text>

      {/* Cửa ra vào */}
      <rect x="214" y="138" width="104" height="100" rx="6" fill="#1C1A18" stroke={INK} strokeWidth="5" />
      <rect x="224" y="148" width="38" height="80" rx="3" fill="#9CC6D3" opacity=".85" />
      <rect x="270" y="148" width="38" height="80" rx="3" fill="#9CC6D3" opacity=".85" />
      <rect x="258" y="182" width="5" height="18" rx="2" fill={ORANGE} />
      <rect x="269" y="182" width="5" height="18" rx="2" fill={ORANGE} />
      <rect x="236" y="156" width="60" height="16" rx="3" fill={CREAM} stroke={INK} strokeWidth="2" />
      <text x="266" y="168" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={INK} fontFamily="Roboto, Arial, sans-serif">MỞ CỬA</text>

      {/* Chậu cây */}
      <path d="M196 238l4-20h12l4 20z" fill={ORANGE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M206 218c-10-8-12-20-4-26 2 10 4 16 4 26zM206 218c8-10 16-14 22-10-6 2-14 6-22 10z" fill="#4E8A5A" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}
