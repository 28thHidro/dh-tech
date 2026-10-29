// Bộ icon nét mảnh dùng chung
const PATHS = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  cart: <><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></>,
  cartPlus: <><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><path d="M14 2v5M11.5 4.5h5" /></>,
  home: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  apple: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><rect x="9" y="5" width="3.5" height="3.5" rx="1" /></>,
  samsung: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><circle cx="10" cy="6" r="1" /><circle cx="10" cy="9" r="1" /></>,
  plug: <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5" />,
  case: <><rect x="6" y="2.5" width="12" height="19" rx="3" /><circle cx="12" cy="12" r="3" /></>,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />,
  battery: <><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M10 2.5h4M12 9l-2 4h4l-2 4" /></>,
  headphones: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="7" rx="1.5" /><rect x="17" y="14" width="4" height="7" rx="1.5" /></>,
  refresh: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" />,
  check: <path d="m5 12 5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} className={className}
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
