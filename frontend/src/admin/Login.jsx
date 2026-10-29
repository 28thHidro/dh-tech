// Trang đăng nhập quản trị: phòng tối, kéo dây đèn bàn để bật đèn rồi mới thấy rõ form.
// (Form vẫn dùng được khi đèn tắt; bấm vào ô nhập cũng tự bật đèn.)
import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/dh-tech-logo.png';
import { API_BASE } from '../lib/api.js';
import { getToken, setToken } from '../lib/admin.js';
import './admin.css';

// Tiếng "tách" của công tắc + tiếng ù nhẹ của bóng đèn, tạo bằng Web Audio (không cần file âm thanh)
function playSwitch(turningOn) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    // Tiếng tách: một đoạn tiếng ồn rất ngắn
    const len = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const click = ctx.createBufferSource();
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.25;
    click.buffer = buf;
    click.connect(clickGain).connect(ctx.destination);
    click.start(now);

    // Tiếng ù khi bật đèn
    if (turningOn) {
      const hum = ctx.createOscillator();
      const humGain = ctx.createGain();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(120, now + 0.05);
      humGain.gain.setValueAtTime(0.0001, now);
      humGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
      humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      hum.connect(humGain).connect(ctx.destination);
      hum.start(now + 0.05);
      hum.stop(now + 0.42);
    }
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Trình duyệt chặn âm thanh thì bỏ qua, đèn vẫn bật bình thường
  }
}

function Lamp({ on }) {
  return (
    <svg className="lamp-svg" viewBox="0 0 220 320" aria-hidden="true">
      {/* Đế đèn */}
      <ellipse cx="62" cy="300" rx="50" ry="9" fill="#000" opacity=".35" />
      <rect x="26" y="278" width="72" height="18" rx="8" fill="#2B2724" stroke="#141414" strokeWidth="4" />
      {/* Hai cánh tay đèn và khớp nối */}
      <path d="M62 280 38 172" stroke="#3A3530" strokeWidth="9" strokeLinecap="round" />
      <path d="M38 172 104 62" stroke="#3A3530" strokeWidth="9" strokeLinecap="round" />
      <circle cx="38" cy="172" r="9" fill="#F28C28" stroke="#141414" strokeWidth="4" />
      <circle cx="104" cy="60" r="8" fill="#F28C28" stroke="#141414" strokeWidth="4" />
      {/* Chao đèn */}
      <path d="M90 44 116 34 168 94 132 118Z" fill={on ? '#F28C28' : '#9A5A1C'} stroke="#141414" strokeWidth="4" strokeLinejoin="round" />
      {/* Bóng đèn */}
      <circle className="lamp-bulb" cx="152" cy="108" r="11" fill={on ? '#FFF4D6' : '#5A524A'} />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(false);
  const [pulling, setPulling] = useState(false);
  const userRef = useRef();

  if (getToken()) return <Navigate to="/admin" replace />;

  const toggle = () => {
    const next = !on;
    setPulling(true);
    setTimeout(() => setPulling(false), 260);
    playSwitch(next);
    setOn(next);
    if (next) setTimeout(() => userRef.current?.focus(), 350);
  };

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: f.get('username'), password: f.get('password') }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      setToken(data.token);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Không kết nối được máy chủ. Thử lại sau ít giây.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`login-page${on ? ' lit' : ''}`}>
      <img className="login-logo" src={logo} alt="DH tech" width="600" height="135" />
      <div className="login-stage">
        <div className="lamp">
          <Lamp on={on} />
          <span className="lamp-cone" aria-hidden="true" />
          <button type="button" className={`lamp-cord${pulling ? ' pull' : ''}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'Tắt đèn' : 'Bật đèn'}>
            <span className="cord-line" /><span className="cord-knob" />
          </button>
          {!on && <span className="lamp-hint">Kéo dây để bật đèn</span>}
        </div>

        <form className="login-card" onSubmit={submit} onFocus={() => { if (!on) { setOn(true); playSwitch(true); } }}>
          <h1>{on ? 'Chào mừng trở lại' : 'Tối quá, bật đèn đã'}</h1>
          <p className="login-sub">Đăng nhập trang quản trị DH tech</p>
          <label htmlFor="username">Tên đăng nhập</label>
          <input ref={userRef} id="username" name="username" required autoComplete="username" />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
          <a className="back" href="/">‹ Về trang bán hàng</a>
        </form>
      </div>
    </div>
  );
}
