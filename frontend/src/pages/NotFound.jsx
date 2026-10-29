import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="wrap notfound">
      <p className="code">404</p>
      <h1>Không tìm thấy trang này</h1>
      <p className="muted">Đường dẫn có thể đã đổi hoặc sản phẩm đã ngừng kinh doanh.</p>
      <Link className="btn btn-primary" to="/">Về trang chủ</Link>
    </div>
  );
}
