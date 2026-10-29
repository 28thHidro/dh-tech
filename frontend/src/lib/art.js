// Hình minh hoạ tạm bằng SVG, dùng khi sản phẩm chưa có ảnh thật.
// Bước 5, admin upload ảnh lên Cloudinary thì component sẽ ưu tiên ảnh thật.

// Đoán kiểu hình từ dữ liệu sản phẩm
export function artKind(p) {
  const cat = p.category;
  if (cat === 'laptop') return 'laptop';
  if (/duo|fold|flip/.test(p.slug || '')) return 'fold';
  if (cat === 'sac-cap') return p.slug?.startsWith('cap') ? 'cable' : 'charger';
  if (cat === 'op-lung') return 'case';
  if (cat === 'kinh') return 'glass';
  if (cat === 'pin') return 'powerbank';
  if (cat === 'tai-nghe' || cat === 'loa') return 'earbuds';
  if (['chuot-ban-phim', 'balo-tui', 'hub-gia-do'].includes(cat)) return 'box';
  if (p.brand_slug === 'apple') return 'apple';
  if (p.slug?.includes('ultra')) return 'ultra';
  return 'galaxy';
}

const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const isLight = (h) => { const [r, g, b] = hexToRgb(h); return (r * 299 + g * 587 + b * 114) / 1000 > 150; };
const shade = (h, a) => '#' + hexToRgb(h).map((v) => Math.max(0, Math.min(255, v + a)).toString(16).padStart(2, '0')).join('');

let n = 0;
// Trả về chuỗi SVG. Màu lấy từ database đã được kiểm tra đúng dạng #RRGGBB.
export function artSvg(kind, color = '#1C1D20', isApple = false) {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : '#1C1D20';
  const u = 'a' + n++;
  const edge = isLight(c) ? '#9AA3AE' : '#3A404B';
  const lens = '#0B0D12';
  const defs = `<defs><linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c, 18)}"/><stop offset="1" stop-color="${shade(c, -14)}"/></linearGradient><linearGradient id="s${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#151414"/><stop offset="1" stop-color="#3A332B"/></linearGradient></defs>`;
  const screen = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#s${u})"/>`;
  const open = (vb) => `<svg viewBox="${vb}" aria-hidden="true">${defs}`;

  switch (kind) {
    case 'fold':
      return `${open('0 0 300 220')}<g transform="skewY(-3) translate(0,8)"><rect x="20" y="16" width="128" height="190" rx="18" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="32" y="40" width="54" height="54" rx="14" fill="${shade(c, -22)}" stroke="${edge}"/><circle cx="48" cy="58" r="10" fill="${lens}"/><circle cx="70" cy="78" r="10" fill="${lens}"/></g><rect x="150" y="10" width="132" height="200" rx="18" fill="#0B0B0B" stroke="${edge}" stroke-width="2"/>${screen(157, 17, 118, 186, 13)}<path d="M157 150 C 200 140, 240 110, 275 60" stroke="#F28C28" stroke-width="2" fill="none" opacity=".5"/><line x1="216" y1="17" x2="216" y2="203" stroke="#fff" stroke-opacity=".08"/></svg>`;
    case 'apple': case 'ultra': case 'galaxy': {
      const cams = kind === 'apple'
        ? `<rect x="80" y="20" width="62" height="64" rx="16" fill="${shade(c, -20)}" stroke="${edge}"/><circle cx="97" cy="38" r="11" fill="${lens}"/><circle cx="97" cy="66" r="11" fill="${lens}"/><circle cx="124" cy="52" r="11" fill="${lens}"/>`
        : (kind === 'ultra' ? [32, 58, 84, 110] : [34, 60, 86]).map((y) => `<circle cx="94" cy="${y}" r="10" fill="${lens}" stroke="${edge}"/><circle cx="91" cy="${y - 3}" r="2.6" fill="#4A4036"/>`).join('');
      return `${open('0 0 200 230')}<rect x="70" y="10" width="110" height="210" rx="22" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/>${cams}<rect x="16" y="22" width="104" height="200" rx="20" fill="#0B0B0B" stroke="${edge}" stroke-width="2"/>${screen(22, 28, 92, 188, 15)}${isApple ? '<rect x="52" y="35" width="32" height="9" rx="4.5" fill="#000"/>' : '<circle cx="68" cy="38" r="3.2" fill="#000"/>'}<path d="M22 170 C 60 160, 90 120, 114 90" stroke="#F28C28" stroke-width="2" fill="none" opacity=".45"/></svg>`;
    }
    case 'charger':
      return `${open('0 0 200 200')}<rect x="50" y="40" width="100" height="120" rx="22" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="72" y="20" width="10" height="26" rx="3" fill="#9AA3AE"/><rect x="118" y="20" width="10" height="26" rx="3" fill="#9AA3AE"/><rect x="82" y="120" width="36" height="9" rx="4.5" fill="${lens}"/><rect x="82" y="138" width="36" height="9" rx="4.5" fill="${lens}"/><path d="M104 70l-12 22h14l-10 20" stroke="#F28C28" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'cable':
      return `${open('0 0 200 200')}<path d="M60 40 C 20 100, 180 90, 140 160" stroke="${shade(c, -10)}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M60 40 C 20 100, 180 90, 140 160" stroke="${edge}" stroke-width="10" stroke-dasharray="3 5" fill="none" opacity=".5"/><rect x="48" y="14" width="24" height="34" rx="6" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="128" y="152" width="24" height="34" rx="6" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/></svg>`;
    case 'case':
      return `${open('0 0 200 230')}<rect x="45" y="10" width="110" height="210" rx="24" fill="${c}" fill-opacity=".55" stroke="#8FB4D6" stroke-width="3"/><rect x="55" y="20" width="66" height="68" rx="16" fill="none" stroke="#8FB4D6" stroke-width="2"/><circle cx="100" cy="135" r="34" fill="none" stroke="#F28C28" stroke-width="3" opacity=".8"/></svg>`;
    case 'glass':
      return `${open('0 0 200 230')}<rect x="40" y="16" width="104" height="200" rx="18" fill="#0B0B0B" stroke="#3A404B" stroke-width="2"/>${screen(46, 22, 92, 188, 14)}<rect x="58" y="10" width="104" height="200" rx="18" fill="#DCEBFA" fill-opacity=".35" stroke="#BFD6EE" stroke-width="2"/><path d="M80 40 L130 20 M90 70 L150 40" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/></svg>`;
    case 'powerbank':
      return `${open('0 0 200 230')}<rect x="50" y="20" width="100" height="190" rx="20" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="82" y="196" width="36" height="8" rx="4" fill="${lens}"/>${[0, 1, 2, 3].map((i) => `<circle cx="${82 + i * 12}" cy="60" r="3.5" fill="${i < 3 ? '#F28C28' : edge}"/>`).join('')}<path d="M104 95l-14 28h16l-12 28" stroke="#F28C28" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'earbuds':
      return `${open('0 0 200 200')}<rect x="40" y="90" width="120" height="86" rx="34" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><line x1="44" y1="120" x2="156" y2="120" stroke="${edge}"/><circle cx="100" cy="150" r="3.5" fill="#F28C28"/><g fill="url(#g${u})" stroke="${edge}" stroke-width="2"><ellipse cx="72" cy="58" rx="20" ry="22"/><rect x="66" y="66" width="12" height="40" rx="6"/><ellipse cx="128" cy="58" rx="20" ry="22"/><rect x="122" y="66" width="12" height="40" rx="6"/></g></svg>`;
    case 'laptop': return `${open('0 0 300 210')}<rect x="40" y="20" width="220" height="146" rx="10" fill="${shade(c, -6)}" stroke="${edge}" stroke-width="2"/>${screen(50, 30, 200, 126, 4)}<path d="M50 140 C 110 130, 170 100, 250 50" stroke="#F28C28" stroke-width="2" fill="none" opacity=".5"/><path d="M14 172 H286 L272 190 H28 Z" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="128" y="172" width="44" height="5" rx="2.5" fill="${shade(c, -30)}"/></svg>`;
    case 'box': return `${open('0 0 200 200')}<rect x="40" y="50" width="120" height="110" rx="16" fill="url(#g${u})" stroke="${edge}" stroke-width="2"/><rect x="60" y="70" width="80" height="10" rx="5" fill="${shade(c, -25)}"/><rect x="60" y="92" width="56" height="10" rx="5" fill="${shade(c, -25)}"/><circle cx="130" cy="135" r="8" fill="#F28C28"/></svg>`;
    default:
      return '';
  }
}
