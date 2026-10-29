// Đăng nhập / đăng ký tài khoản khách hàng
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import LampAuth, { AuthField } from '../components/LampAuth.jsx';
import Icon from '../components/Icon.jsx';
import { accountFetch, useAccount } from '../lib/account.jsx';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, signIn } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const formRef = useRef();
  const goTo = location.state?.from || '/tai-khoan';

  useEffect(() => { document.title = `${isLogin ? 'Đăng nhập' : 'Đăng ký'} | DH tech`; }, [isLogin]);

  if (user) return <Navigate to={goTo} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!isLogin && f.get('password') !== f.get('password2')) { setError('Hai mật khẩu chưa giống nhau'); return; }
    setBusy(true);
    setError('');
    try {
      const remember = f.get('remember') === 'on';
      const body = isLogin
        ? { login: f.get('login'), password: f.get('password'), remember }
        : { full_name: f.get('full_name'), phone: f.get('phone'), email: f.get('email'), password: f.get('password'), remember };
      const data = await accountFetch(isLogin ? '/api/account/login' : '/api/account/register', { method: 'POST', body });
      signIn(data.token, data.customer, remember);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const focusFirst = () => setTimeout(() => formRef.current?.querySelector('input')?.focus(), 350);

  return (
    <LampAuth
      scope="Khách hàng"
      headline={isLogin ? ['Bật đèn.', 'Vào cửa hàng.'] : ['Bật đèn.', 'Làm quen nhé.']}
      text={isLogin
        ? 'Đăng nhập để xem lại đơn hàng, theo dõi trạng thái giao và đặt mua nhanh hơn.'
        : 'Tạo tài khoản miễn phí để lưu đơn hàng, theo dõi giao hàng và nhận ưu đãi thành viên.'}
      title={isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
      subtitle={isLogin ? 'Chào mừng bạn quay lại DH tech.' : 'Chỉ mất chưa tới một phút.'}
      onLit={focusFirst}
    >
      <form ref={formRef} onSubmit={submit} key={mode}>
        {isLogin ? (
          <>
            <AuthField icon="user" label="Số điện thoại hoặc email" id="login" required autoComplete="username" placeholder="0901234567" />
            <AuthField icon="lock" label="Mật khẩu" id="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </>
        ) : (
          <>
            <AuthField icon="user" label="Họ và tên" id="full_name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nguyễn Văn An" />
            <AuthField icon="phone" label="Số điện thoại" id="phone" required inputMode="tel" pattern="0[0-9]{9}" title="10 chữ số, bắt đầu bằng 0" autoComplete="tel" placeholder="0901234567" />
            <AuthField icon="mail" label="Email (không bắt buộc)" id="email" type="email" maxLength={120} autoComplete="email" placeholder="ban@email.com" />
            <AuthField icon="lock" label="Mật khẩu" id="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Ít nhất 8 ký tự" />
            <AuthField icon="lock" label="Nhập lại mật khẩu" id="password2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Nhập lại cho chắc" />
          </>
        )}

        <div className="auth-row">
          <label><input type="checkbox" name="remember" defaultChecked /> Ghi nhớ đăng nhập</label>
          {isLogin && <button type="button" className="linkish" onClick={() => setForgot((v) => !v)}>Quên mật khẩu?</button>}
        </div>
        {forgot && <p className="auth-note">Gọi tổng đài <b>1900 0000</b>, nhân viên sẽ xác minh số điện thoại và đặt lại mật khẩu giúp bạn.</p>}

        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Đang xử lý…' : <>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'} <Icon name="arrow" size={18} /></>}
        </button>

        <p className="auth-switch">
          {isLogin
            ? <>Chưa có tài khoản? <Link to="/dang-ky" state={location.state}>Đăng ký ngay</Link></>
            : <>Đã có tài khoản? <Link to="/dang-nhap" state={location.state}>Đăng nhập</Link></>}
        </p>
      </form>
    </LampAuth>
  );
}
