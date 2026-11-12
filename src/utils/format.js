export const num = (v) => Number(v) || 0;

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num(n));

export const rupiahSingkat = (n) => {
  const v = num(n);
  const f = (x, d) => x.toLocaleString('id-ID', { maximumFractionDigits: d });
  if (v >= 1e9) return `Rp${f(v / 1e9, 1)} M`;
  if (v >= 1e6) return `Rp${f(v / 1e6, 1)} jt`;
  if (v >= 1e3) return `Rp${f(v / 1e3, 0)} rb`;
  return `Rp${v}`;
};

export const tanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

// periode berformat "YYYY-MM"
export const namaBulan = (p, pendek = false) => {
  if (!p) return '-';
  const [y, m] = p.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
    month: pendek ? 'short' : 'long',
    year: 'numeric',
  });
};

const pad = (n) => String(n).padStart(2, '0');

export const bulanIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Daftar n periode terakhir, dari yang terlama sampai bulan ini
export const periodeTerakhir = (n) => {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}`;
  });
};

export const inisial = (nama = '') =>
  nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || '?';

// Timestamp Firestore -> { tanggal: "29 September 2026", jam: "14:28 WIB" }
export const waktuWib = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return null;
  const opsi = { timeZone: 'Asia/Jakarta' };
  return {
    tanggal: d.toLocaleDateString('id-ID', { ...opsi, day: 'numeric', month: 'long', year: 'numeric' }),
    jam: `${d.toLocaleTimeString('id-ID', { ...opsi, hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')} WIB`,
  };
};
