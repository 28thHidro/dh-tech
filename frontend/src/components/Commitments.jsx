import Icon from './Icon.jsx';

const ITEMS = [
  ['shield', 'Chính hãng 100%', 'Bảo hành 12 tháng'],
  ['refresh', 'Đổi mới 30 ngày', 'Nếu lỗi từ nhà sản xuất'],
  ['truck', 'Giao nhanh 2 giờ', 'Nội thành TP.HCM'],
  ['card', 'Trả góp 0%', 'Duyệt nhanh qua thẻ'],
];

export default function Commitments() {
  return (
    <div className="commit">
      {ITEMS.map(([icon, title, sub]) => (
        <div key={title}>
          <Icon name={icon} size={28} />
          <p><b>{title}</b><span>{sub}</span></p>
        </div>
      ))}
    </div>
  );
}
