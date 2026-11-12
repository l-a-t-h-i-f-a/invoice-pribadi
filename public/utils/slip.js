import { num } from './format';

export const totalItems = (items = []) => items.reduce((a, it) => a + num(it.nominal), 0);

// Buang baris kosong & key internal sebelum disimpan ke Firestore
export const bersihkanItems = (items) =>
  items
    .filter((it) => it.keterangan.trim() || num(it.nominal))
    .map((it) => ({ keterangan: it.keterangan.trim() || '-', nominal: num(it.nominal) }));

export function hitungSlip(gajiPokok, pendapatan, potongan) {
  const totalPendapatan = num(gajiPokok) + totalItems(pendapatan);
  const totalPotongan = totalItems(potongan);
  return { totalPendapatan, totalPotongan, gajiBersih: totalPendapatan - totalPotongan };
}

// Slip versi lama menyimpan tunjangan/lembur/bonus/BPJS/PPh 21 sebagai field tetap.
// Ubah jadi daftar rincian supaya tetap bisa ditampilkan & diedit.
const LAMA_PENDAPATAN = [['tunjangan', 'Tunjangan'], ['lembur', 'Lembur'], ['bonus', 'Bonus']];
const LAMA_POTONGAN = [['potBpjs', 'BPJS'], ['potPajak', 'PPh 21'], ['potLain', 'Potongan lain']];

export function rincian(s) {
  const dariLama = (pasangan) =>
    pasangan.filter(([k]) => num(s[k])).map(([k, label]) => ({ keterangan: label, nominal: num(s[k]) }));
  return {
    pendapatan: Array.isArray(s.pendapatan) ? s.pendapatan : dariLama(LAMA_PENDAPATAN),
    potongan: Array.isArray(s.potongan) ? s.potongan : dariLama(LAMA_POTONGAN),
  };
}
