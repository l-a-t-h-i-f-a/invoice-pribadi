const env = import.meta.env;

// Data perusahaan dari .env (baris alamat dipisah dengan "|")
export const PERUSAHAAN = {
  nama: env.VITE_NAMA_PERUSAHAAN || 'Perusahaan Kita',
  alamat: (env.VITE_ALAMAT_PERUSAHAAN || '').split('|').map((s) => s.trim()).filter(Boolean),
  telp: env.VITE_TELP_PERUSAHAAN || '',
  email: env.VITE_EMAIL_PERUSAHAAN || '',
  penandatangan: env.VITE_PENANDATANGAN || '',
  jabatan: env.VITE_JABATAN_PENANDATANGAN || '',
  // Taruh file gambar di folder public/ dengan nama ini
  logo: '/logo.png',
  logoIcon: '/logo-icon.png',
  ttd: '/ttd.png',
  stempel: '/stempel.png',
};
