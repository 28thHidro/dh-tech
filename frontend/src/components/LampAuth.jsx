// Khung màn hình đăng nhập / đăng ký dùng chung cho khách hàng và quản trị:
// phòng tối, phải KÉO dây đèn bàn xuống thì đèn mới sáng và form mới dùng được.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import logo from '../../assets/dh-tech-logo.png';
import Icon from './Icon.jsx';
import './auth.css';

const PULL_NEEDED = 34; // kéo xuống ít nhất 34px mới tính là bật/tắt

// Tiếng "tách" của công tắc + tiếng ù nhẹ của bóng đèn, tạo bằng Web Audio (không cần file âm thanh)
function playSwitch(turningOn) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
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
    // Trình duyệt chặn âm thanh thì bỏ qua
  }
}

function LampArt({ on }) {
  return (
    <svg className="lamp-svg" viewBox="0 0 220 320" aria-hidden="true">
      <ellipse cx="62" cy="300" rx="50" ry="9" fill="#000" opacity=".35" />
      <rect x="26" y="278" width="72" height="18" rx="8" fill="#2B2724" stroke="#141414" strokeWidth="4" />
      <path d="M62 280 38 172" stroke="#3A3530" strokeWidth="9" strokeLinecap="round" />
      <path d="M38 172 104 62" stroke="#3A3530" strokeWidth="9" strokeLinecap="round" />
      <circle cx="38" cy="172" r="9" fill="#F28C28" stroke="#141414" strokeWidth="4" />
      <circle cx="104" cy="60" r="8" fill="#F28C28" stroke="#141414" strokeWidth="4" />
      <path d="M90 44 116 34 168 94 132 118Z" fill={on ? '#F28C28' : '#7A4A1C'} stroke="#141414" strokeWidth="4" strokeLinejoin="round" />
      <circle className="lamp-bulb" cx="152" cy="108" r="11" fill={on ? '#FFF4D6' : '#4A443D'} />
    </svg>
  );
}

// Đèn + dây kéo. Chuột/tay kéo dây xuống rồi thả; bàn phím: Tab tới dây rồi nhấn Enter hoặc phím cách.
function Lamp({ on, onToggle }) {
  const [dy, setDy] = useState(0);
  const [nudge, setNudge] = useState(false);
  const startY = useRef(null);
  const dyRef = useRef(0);

  const move = (y) => { const d = Math.max(0, Math.min(70, y - startY.current)); dyRef.current = d; setDy(d); };
  const release = () => {
    if (startY.current == null) return;
    const d = dyRef.current;
    startY.current = null;
    dyRef.current = 0;
    setDy(0);
    if (d >= PULL_NEEDED) onToggle();
    else { setNudge(true); setTimeout(() => setNudge(false), 900); } // bấm mà không kéo: nhắc kéo xuống
  };

  return (
    <div className="lamp">
      <LampArt on={on} />
      <span className="lamp-cone" aria-hidden="true" />
      <button
        type="button"
        className={`lamp-cord${startY.current != null ? ' dragging' : ''}${dy >= PULL_NEEDED ? ' ready' : ''}`}
        style={{ '--dy': `${dy}px` }}
        aria-pressed={on}
        aria-label={on ? 'Kéo dây để tắt đèn' : 'Kéo dây để bật đèn'}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startY.current = e.clientY; dyRef.current = 0; }}
        onPointerMove={(e) => { if (startY.current != null) move(e.clientY); }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <span className="cord-line" /><span className="cord-knob" />
      </button>
      {!on && <span className={`lamp-hint${nudge ? ' nudge' : ''}`}>{nudge ? 'Kéo xuống nữa nhé!' : 'Kéo dây xuống để bật đèn'}</span>}
    </div>
  );
}

// Ô nhập có icon, nhãn nhỏ; ô mật khẩu có nút hiện/ẩn
export function AuthField({ icon, label, type = 'text', id, ...rest }) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="af">
      <label htmlFor={id}>{label}</label>
      <div className="af-box">
        <Icon name={icon} size={18} />
        <input id={id} name={id} type={isPass && show ? 'text' : type} {...rest} />
        {isPass && (
          <button type="button" className="af-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// scope: chữ nhỏ trên thẻ ("KHÁCH HÀNG" / "QUẢN TRỊ"); headline: [dòng viền, dòng đặc]
export default function LampAuth({ scope, headline, text, title, subtitle, children, onLit }) {
  const [on, setOn] = useState(false);
  const toggle = () => {
    const next = !on;
    playSwitch(next);
    setOn(next);
    if (next) onLit?.();
  };

  // Phím tắt cho người dùng bàn phím: phím L bật/tắt đèn (khi không gõ trong ô nhập)
  useEffect(() => {
    const onKey = (e) => { if ((e.key === 'l' || e.key === 'L') && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) toggle(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`auth${on ? ' lit' : ''}`}>
      <header className="auth-top">
        <Link to="/" aria-label="DH tech, về trang chủ"><img src={logo} alt="DH tech" width="600" height="135" /></Link>
        <Link className="auth-back" to="/">‹ Về cửa hàng</Link>
      </header>

      <main className="auth-main">
        <section className="auth-hero">
          <span className="auth-eyebrow"><i /> DH tech · {scope}</span>
          <h1><span className="outline">{headline[0]}</span><span className="solid">{headline[1]}</span></h1>
          <p>{text}</p>
          <Lamp on={on} onToggle={toggle} />
        </section>

        <section className="auth-card" aria-label={title}>
          <div className="auth-meta">
            <span>{scope}</span>
            <span className={`auth-status${on ? ' on' : ''}`}><i />{on ? 'Đèn đã bật' : 'Đèn đang tắt'}</span>
          </div>
          <h2>{title}</h2>
          <p className="auth-sub">{subtitle}</p>
          {!on && <p className="auth-lock"><Icon name="lock" size={16} /> Kéo dây đèn để mở khoá form</p>}
          {/* fieldset disabled: khi đèn tắt, mọi ô nhập và nút trong form đều bị khoá */}
          <fieldset className="auth-fields" disabled={!on}>{children}</fieldset>
        </section>
      </main>
    </div>
  );
}
