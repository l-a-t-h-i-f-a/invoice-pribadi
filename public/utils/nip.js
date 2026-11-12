// Nomor terbesar yang sudah dipakai untuk prefix ini, mis. "PROD-007" -> 7
export const nomorTerakhir = (karyawan, prefix) =>
  Math.max(
    0,
    ...karyawan.map((k) => {
      const m = /^([A-Z]+)-?(\d+)$/i.exec(String(k.nip || '').trim());
      return m && m[1].toUpperCase() === prefix ? Number(m[2]) : 0;
    }),
  );

export const formatNip = (prefix, no) => `${prefix}-${String(no).padStart(3, '0')}`;
