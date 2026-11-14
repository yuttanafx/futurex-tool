// โลโก้ตะกร้า วาดเอง ใช้ซ้ำในแถบบนและหน้าล็อกอิน
export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="ตะกร้า">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a4c" />
          <stop offset="1" stopColor="#e2571c" />
        </linearGradient>
      </defs>
      <path d="M20 26c0-9 5-16 12-16s12 7 12 16" fill="none" stroke="#ffd2b8" strokeWidth="4" strokeLinecap="round" />
      <path d="M6 26h52l-5.5 24a6 6 0 0 1-5.8 4.6H17.3A6 6 0 0 1 11.5 50z" fill="url(#bm-g)" />
      <path d="M24 33v14M32 33v14M40 33v14" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
