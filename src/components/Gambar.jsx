import { useState } from 'react';

// Gambar opsional (logo / tanda tangan): disembunyikan kalau file belum ada di public/
export default function Gambar({ src, alt, className, fallback = null }) {
  const [gagal, setGagal] = useState(false);
  if (gagal) return fallback;
  return <img src={src} alt={alt} className={className} onError={() => setGagal(true)} />;
}
