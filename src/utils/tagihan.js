import { hariIni, num } from './format';

export const STATUS = { belum: 'Belum Lunas', sebagian: 'Sebagian', lunas: 'Lunas' };
export const JENIS_INVOICE = ['DP', 'Cicilan', 'Pelunasan'];

// Tagihan versi lama memakai field `pihak`, `kategori` & `deskripsi`
export const namaPenerima = (t) => t.nama || t.pihak || '-';

export const lokasi = (t) => [t.kota, t.provinsi].filter(Boolean).join(', ');

export const subtotal = (it) => num(it.harga) * num(it.qty);
export const totalItems = (items) => items.reduce((a, it) => a + subtotal(it), 0);

// Item disimpan sebagai { nama, harga, qty }. Versi lama: { keterangan, nominal } atau hanya `jumlah`.
export const itemsTagihan = (t) => {
  let items = Array.isArray(t.items) ? t.items : [];
  if (!Array.isArray(t.items) && num(t.jumlah)) {
    items = [{ nama: t.deskripsi || t.kategori || 'Tagihan', harga: num(t.jumlah), qty: 1 }];
  }
  return items.map((it) => ({
    nama: it.nama ?? it.keterangan ?? '',
    harga: num(it.harga ?? it.nominal),
    qty: num(it.qty ?? 1) || 1,
  }));
};

// Barang habis pakai (lampiran invoice), tidak ikut menambah total tagihan
export const bhpTagihan = (t) =>
  (Array.isArray(t.bhp) ? t.bhp : []).map((it) => ({
    nama: it.nama || '',
    satuan: it.satuan || '',
    harga: num(it.harga),
    qty: num(it.qty ?? 1) || 1,
  }));

export const invoicesTagihan = (t) => (Array.isArray(t.invoices) ? t.invoices : []);

export const invoiceTelat = (inv) => !inv.tglBayar && inv.tenggat && inv.tenggat < hariIni();
export const telat = (t) => invoicesTagihan(t).some(invoiceTelat);

export function ringkas(t) {
  const items = itemsTagihan(t);
  const invoices = invoicesTagihan(t);
  const total = totalItems(items);
  let dibayar = invoices.filter((i) => i.tglBayar).reduce((a, i) => a + num(i.jumlah), 0);
  if (!invoices.length && t.status === STATUS.lunas) dibayar = total; // data lama tanpa invoice
  const ditagih = invoices.reduce((a, i) => a + num(i.jumlah), 0);
  const status = total > 0 && dibayar >= total ? STATUS.lunas : dibayar > 0 ? STATUS.sebagian : STATUS.belum;
  return { items, invoices, total, dibayar, sisa: Math.max(total - dibayar, 0), belumDitagih: Math.max(total - ditagih, 0), status };
}

export const toneStatus = { [STATUS.belum]: 'yellow', [STATUS.sebagian]: 'purple', [STATUS.lunas]: 'green' };

// Nomor invoice berurutan di semua tagihan, contoh: INV-00006/09/2026-DP
export function nomorInvoiceBaru(semuaTagihan, jenis, tanggal) {
  const seq = Math.max(0, ...semuaTagihan.flatMap((t) => invoicesTagihan(t).map((i) => num(i.seq)))) + 1;
  const [y, m] = tanggal.split('-');
  return { seq, nomor: `INV-${String(seq).padStart(5, '0')}/${m}/${y}-${jenis.toUpperCase()}` };
}

export const idAcak = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
