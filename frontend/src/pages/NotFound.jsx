import { Link } from 'react-router';
import Mascot from '../components/Mascot.jsx';

export default function NotFound() {
  return (
    <div className="wrap notfound">
      <div className="mascot-bg big"><Mascot size={130} mood="sad" title="Cam đang bối rối" /></div>
      <p className="code">404</p>
      <h1>Ối, Cam không tìm thấy trang này</h1>
      <p className="muted">Đường dẫn có thể đã đổi hoặc sản phẩm đã ngừng kinh doanh.</p>
      <Link className="btn btn-primary" to="/">Về trang chủ</Link>
    </div>
  );
}
