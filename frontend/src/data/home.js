// =====================================================================
// NỘI DUNG TRANG CHỦ: muốn đổi banner, ô khuyến mãi, video thì sửa file này,
// rồi commit + push. Giá và ảnh sản phẩm tự lấy từ Admin theo "slug".
// =====================================================================

// VIDEO ĐẠI DIỆN đầu trang: tự đổi theo thời gian.
// Website chọn video đầu tiên có ngày hôm nay nằm trong khoảng from - to (YYYY-MM-DD).
// Video không ghi from/to là video mặc định, nên đặt ở cuối danh sách.
//   mp4      (khuyên dùng) link video .mp4 tải lên Cloudinary, 10-30 giây, không cần tiếng
//   youtube  hoặc id video YouTube (dùng khi chưa có mp4)
//   poster   (tuỳ chọn) ảnh hiện trong lúc video đang tải
export const HERO = [
  {
    from: '2026-10-20', to: '2026-11-30',
    youtube: 'FUfGcZ092b0', mp4: '', poster: '',
    kicker: 'Vừa ra mắt',
    title: 'iPhone Duo đã về DH tech',
    text: 'Chiếc iPhone gập đầu tiên. Trải nghiệm máy thật tại cửa hàng hoặc đặt giao trong 2 giờ.',
    cta: ['Mua ngay', '/san-pham/iphone-duo'],
    cta2: ['Xem deal hot', '#deal'],
  },
  {
    youtube: 'Np0BJIh1wt4', mp4: '', poster: '',
    kicker: 'Galaxy Z Series',
    title: 'Gập mở, đẳng cấp mới',
    text: 'Galaxy Z Fold8 Ultra giảm ngay 3 triệu, tặng bao da kèm bút.',
    cta: ['Mua ngay', '/san-pham/galaxy-z-fold8-ultra'],
    cta2: ['Xem deal hot', '#deal'],
  },
];

// Banner lớn. tab = chữ trên thanh tab phía trên banner (máy tính).
//   bg      màu nền của slide (mỗi slide một màu cho sinh động)
//   big     chữ to mờ chạy phía sau
//   image   (tuỳ chọn) link ảnh banner tự thiết kế trên Canva, kích thước 1300 x 580 px.
//           Có image thì website hiện nguyên ảnh đó thay cho chữ + ảnh sản phẩm.
export const SLIDES = [
  {
    slug: 'iphone-18-pro-max',
    bg: '#4A1621',
    big: 'PRO',
    image: '',
    tab: ['iPhone 18 Pro', 'Sẵn hàng, giao ngay'],
    eyebrow: 'iPhone 18 Series',
    title: ['iPhone 18 Pro Max', 'chip A20 Pro'],
    text: 'Camera 48MP Pro Fusion, pin xem video đến 43 giờ. Thu cũ trợ giá đến 3 triệu.',
  },
  {
    slug: 'iphone-duo',
    bg: '#1B2A41',
    big: 'DUO',
    image: '',
    tab: ['iPhone Duo', 'iPhone gập đầu tiên'],
    eyebrow: 'Mới · Có hàng từ 23/10',
    title: ['iPhone Duo', 'mở ra là màn hình lớn'],
    text: 'Chiếc iPhone gập đầu tiên. Đặt hàng hôm nay, giao nhanh trong 2 giờ.',
  },
  {
    slug: 'galaxy-z-fold8-ultra',
    bg: '#0F3550',
    big: 'FOLD',
    image: '',
    tab: ['Galaxy Z Fold8', 'Gập mở đẳng cấp'],
    eyebrow: 'Galaxy Z Series',
    title: ['Galaxy Z Fold8 Ultra', 'màn hình gập cỡ lớn'],
    text: 'Giảm ngay 3 triệu, tặng bao da kèm bút.',
  },
  {
    slug: 'macbook-air-13-m5',
    bg: '#23392F',
    big: 'AIR',
    image: '',
    tab: ['MacBook Air M5', 'Ưu đãi tựu trường'],
    eyebrow: 'Mùa tựu trường',
    title: ['MacBook Air M5', 'mỏng nhẹ, pin cả ngày'],
    text: 'Giảm thêm cho học sinh, sinh viên. Trả góp 0% qua thẻ tín dụng.',
  },
  {
    slug: 'xiaomi-17-ultra',
    bg: '#3B1F0C',
    big: 'ULTRA',
    image: '',
    tab: ['Xiaomi 17 Ultra', 'Camera Leica'],
    eyebrow: 'Flagship Xiaomi',
    title: ['Xiaomi 17 Ultra', 'chụp đêm cực đỉnh'],
    text: 'Tặng sạc nhanh chính hãng, bảo hành 18 tháng.',
  },
];

// Video sản phẩm: lấy phần mã sau "watch?v=" trong link YouTube.
// Ví dụ link https://www.youtube.com/watch?v=FUfGcZ092b0 thì id là FUfGcZ092b0
//   status: "Vừa ra mắt" hoặc "Sắp ra mắt"; when: chữ ngày hiện cạnh tên
export const VIDEOS = [
  { id: 'FUfGcZ092b0', title: 'Giới thiệu iPhone Duo', by: 'Apple', slug: 'iphone-duo', status: 'Vừa ra mắt', when: '09/2026' },
  { id: 'mN2Td45Ln5M', title: 'Giới thiệu iPhone 18 Pro', by: 'Apple', slug: 'iphone-18-pro', status: 'Vừa ra mắt', when: '09/2026' },
  { id: 'Np0BJIh1wt4', title: 'Galaxy Z Fold8 Ultra và Fold8', by: 'Samsung', slug: 'galaxy-z-fold8-ultra', status: 'Vừa ra mắt', when: '07/2026' },
  { id: 'URwVV5tTJIA', title: 'MacBook Air mới với chip M5', by: 'Apple', slug: 'macbook-air-13-m5', status: 'Vừa ra mắt', when: '2026' },
];

// Khối cửa hàng có linh vật
export const STORE = {
  title: 'Ghé cửa hàng DH tech',
  text: 'Cầm thử máy thật, được Cam tư vấn tận tình. Thu cũ đổi mới, lên đời ngay tại chỗ.',
  hours: '8:00 đến 22:00 mỗi ngày',
  phone: '1900 0000',
};

// Dải banner ngang giữa trang. Có image (1300 x 260 px) thì hiện ảnh, không thì hiện chữ + linh vật.
export const STRIP = {
  image: '',
  to: '/danh-muc/dien-thoai',
  kicker: 'Tưng bừng cuối tháng',
  title: 'Deal khủng giảm đến 50%',
  text: 'Phụ kiện mua kèm, thu cũ trợ giá, trả góp 0%. Đến hết 31/10.',
};

// "Mới ra mắt" (kiểu Apple): thẻ lớn trượt ngang
export const NEW_ARRIVALS = [
  { slug: 'iphone-duo', kicker: 'Mới', tagline: 'iPhone gập đầu tiên.' },
  { slug: 'iphone-18-pro-max', kicker: 'Mới', tagline: 'Pro hơn bao giờ hết.' },
  { slug: 'galaxy-z-fold8-ultra', kicker: 'Mới', tagline: 'Màn hình lớn, gập gọn túi.' },
  { slug: 'macbook-air-13-m5', kicker: 'Mới', tagline: 'Mỏng nhẹ, pin cả ngày.' },
  { slug: 'xiaomi-17-ultra', kicker: 'Mới', tagline: 'Ống kính Leica, chụp đêm rõ nét.' },
  { slug: 'galaxy-z-flip8', kicker: 'Mới', tagline: 'Nhỏ gọn, cá tính.' },
];

// Khối giới thiệu tràn màn hình (kiểu Tesla / Apple)
export const SHOWCASE = {
  slug: 'iphone-18-pro-max',
  kicker: 'iPhone 18 Pro Max',
  title: 'Pro. Từ trong ra ngoài.',
  text: 'Chip A20 Pro, camera 48MP Pro Fusion, pin xem video đến 43 giờ.',
  video: 'mN2Td45Ln5M', // id video YouTube cho nút "Xem video" (để trống thì ẩn nút)
};

