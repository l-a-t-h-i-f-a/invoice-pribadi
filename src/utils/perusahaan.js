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

// Kop khusus invoice (sesuai template src/paper/Template Surat Dispensasi Mersif Academy.docx)
export const KOP_INVOICE = {
  nama: 'Mersif Academy',
  alamat: [
    'Dusun Ganggang, Desa Gadingan',
    'Kec. Mojolaban, Kab. Sukoharjo',
    'Jawa Tengah 57554',
  ],
  telp: '(+62) 895-8028-50204',
  email: 'mersifacademy@gmail.com',
  logo: '/logo-mersif.png',
};

// Blok tanda tangan invoice versi Mersif (penandatangan tetap dari .env)
KOP_INVOICE.ttd = '/ttd-mersif.png';
KOP_INVOICE.penandatangan = PERUSAHAAN.penandatangan;
KOP_INVOICE.jabatan = PERUSAHAAN.jabatan;
