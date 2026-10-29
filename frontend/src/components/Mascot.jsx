// Linh vật "Cam" của DH tech: chú mèo cam ôm điện thoại.
// Vẽ bằng SVG nên nét ở mọi kích thước, đổi màu chỉ cần sửa các hằng số dưới đây.
// mood: "wave" (vẫy tay chào), "phone" (cầm điện thoại), "sad" (trang lỗi)
const ORANGE = '#F28C28';
const INK = '#141414';
const CREAM = '#FFF3E4';
const SCREEN = '#FFE2C2';
const BLUSH = '#F7A85A';
const DEEP = '#D9701A'; // mảng tối tạo khối, đỡ phẳng

// Cánh tay: một nét đen dày bên dưới, một nét cam mảnh hơn đè lên, nhìn như có viền
function Arm({ d }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth="17" strokeLinecap="round" fill="none" />
      <path d={d} stroke={ORANGE} strokeWidth="7" strokeLinecap="round" fill="none" />
    </>
  );
}

export default function Mascot({ size = 120, mood = 'wave', className = '', title = 'Cam, linh vật DH tech' }) {
  const sad = mood === 'sad';
  return (
    <svg className={`mascot ${mood} ${className}`} width={size} height={size * 1.15} viewBox="0 0 200 230" role="img" aria-label={title}>
      {/* Bóng đổ dưới chân */}
      <ellipse cx="100" cy="220" rx="66" ry="7" fill="#000" opacity=".16" />
      <g stroke={INK} strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Đuôi */}
        <path className="m-tail" d="M140 204c32 2 44-18 38-40-3-12-16-15-21-7 9 4 11 15 3 23-6 6-12 8-20 9z" fill={ORANGE} />
        {/* Thân ngồi + bụng kem */}
        <path d="M60 156c0-12 12-20 40-20s40 8 40 20v32c0 15-13 24-40 24s-40-9-40-24z" fill={ORANGE} />
        <path d="M82 160c0-5 7-7 18-7s18 2 18 7v24c0 9-7 13-18 13s-18-4-18-13z" fill={CREAM} strokeWidth="5" />
        {/* Tai */}
        <path d="M44 26l10 52 36-27zM156 26l-10 52-36-27z" fill={ORANGE} />
        {/* Đầu */}
        <path d="M100 42c-45 0-63 27-63 58 0 31 27 47 63 47s63-16 63-47c0-31-18-58-63-58z" fill={ORANGE} />
      </g>
      {/* Mảng tối dưới cằm và bên phải thân, điểm sáng trên đầu: tạo khối cho tự nhiên */}
      <path d="M43 113c5 21 27 31 57 31s52-10 57-31c-12 12-32 19-57 19s-45-7-57-19z" fill={DEEP} />
      <path d="M128 148c7 4 9 10 9 15v25c0 11-9 19-27 21 12-6 18-13 18-23z" fill={DEEP} />
      <ellipse cx="72" cy="62" rx="13" ry="6" transform="rotate(-28 72 62)" fill="#fff" opacity=".28" />
      {/* Lòng tai */}
      <path d="M54 43l6 27 18-14zM146 43l-6 27-18-14z" fill={CREAM} />

      {/* Mắt (chớp mắt bằng CSS) */}
      <g className="m-eyes">
        {sad ? (
          <path d="M70 90l14 14M84 90l-14 14M116 90l14 14M130 90l-14 14" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx="77" cy="98" rx="9.5" ry="12.5" fill={INK} />
            <ellipse cx="123" cy="98" rx="9.5" ry="12.5" fill={INK} />
            <circle cx="80.5" cy="93.5" r="3.6" fill="#fff" />
            <circle cx="126.5" cy="93.5" r="3.6" fill="#fff" />
          </>
        )}
      </g>
      {/* Mũi, miệng, ria, má */}
      <path d="M94.5 113h11l-5.5 6.5z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      {sad
        ? <path d="M90 128q10-8 20 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        : <path d="M100 120q-6 8-12 4M100 120q6 8 12 4" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />}
      <path d="M58 112l-22-5M58 120l-22 3M142 112l22-5M142 120l22 3" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="64" cy="122" r="6.5" fill={BLUSH} />
      <circle cx="136" cy="122" r="6.5" fill={BLUSH} />

      {/* Chân trước */}
      <g stroke={INK} strokeWidth="5" fill={ORANGE}>
        <ellipse cx="84" cy="210" rx="13" ry="9" />
        <ellipse cx="116" cy="210" rx="13" ry="9" />
      </g>

      {sad ? (
        <>
          {/* Buồn: hai tay buông xuôi, không cầm điện thoại */}
          <Arm d="M66 160 56 186" />
          <Arm d="M134 160 144 186" />
        </>
      ) : (
        <>
          {/* Tay trái: vẫy chào hoặc đặt trên bụng */}
          <g className="m-arm-l">
            {mood === 'wave'
              ? <><Arm d="M66 158 40 128" /><circle cx="38" cy="124" r="11" fill={ORANGE} stroke={INK} strokeWidth="5" /></>
              : <><Arm d="M66 160 80 184" /><circle cx="82" cy="186" r="10" fill={ORANGE} stroke={INK} strokeWidth="5" /></>}
          </g>
          {/* Điện thoại cầm bên phải, hơi nghiêng */}
          <g transform="rotate(12 148 172)">
            <rect x="132" y="142" width="34" height="58" rx="8" fill={INK} />
            <rect x="138" y="149" width="22" height="40" rx="3" fill={SCREEN} />
            <path d="M143 162h12M143 169h8" stroke={ORANGE} strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <Arm d="M132 160 136 176" />
          <circle cx="137" cy="180" r="10.5" fill={ORANGE} stroke={INK} strokeWidth="5" />
        </>
      )}
    </svg>
  );
}
