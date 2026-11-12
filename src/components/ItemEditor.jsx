import { RupiahInput } from './RincianList';
import { rupiah, num } from '../utils/format';
import { subtotal, totalItems } from '../utils/tagihan';

let seq = 0;
export const itemBaru = (it = {}) => ({ nama: '', harga: '', qty: 1, satuan: '', ...it, _k: ++seq });

// Buang baris kosong & key internal sebelum disimpan
export const bersihkanItemTagihan = (items) =>
  items
    .filter((it) => it.nama.trim() || num(it.harga))
    .map((it) => ({ nama: it.nama.trim() || '-', harga: num(it.harga), qty: num(it.qty) || 1 }));

// Sama seperti item tagihan, tapi BHP juga menyimpan satuan (pcs, box, liter, ...)
export const bersihkanBhp = (items) =>
  items
    .filter((it) => it.nama.trim() || num(it.harga))
    .map((it) => ({ nama: it.nama.trim() || '-', satuan: (it.satuan || '').trim(), harga: num(it.harga), qty: num(it.qty) || 1 }));

export default function ItemEditor({
  items, onChange, satuan = false, labelNama = 'Nama Item', placeholder = 'mis. Jasa desain logo', labelTambah = 'Tambah Item',
}) {
  const nKolom = satuan ? 7 : 6;
  const ubah = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const hapus = (i) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="item-editor">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{labelNama}</th>
              <th>Harga</th>
              <th style={{ width: 90 }}>Qty</th>
              {satuan && <th style={{ width: 110 }}>Satuan</th>}
              <th className="num">Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={nKolom} className="dt-empty">Belum ada item. Klik “{labelTambah}” di bawah 🎀</td></tr>
            )}
            {items.map((it, i) => (
              <tr key={it._k}>
                <td>{i + 1}</td>
                <td>
                  <input placeholder={placeholder} aria-label={labelNama} value={it.nama} onChange={(e) => ubah(i, { nama: e.target.value })} />
                </td>
                <td style={{ minWidth: 160 }}>
                  <RupiahInput value={it.harga} onChange={(v) => ubah(i, { harga: v })} />
                </td>
                <td>
                  <input type="number" min="1" aria-label="Qty" value={it.qty} onChange={(e) => ubah(i, { qty: e.target.value })} />
                </td>
                {satuan && (
                  <td>
                    <input placeholder="pcs" aria-label="Satuan" value={it.satuan} onChange={(e) => ubah(i, { satuan: e.target.value })} />
                  </td>
                )}
                <td className="num"><strong>{rupiah(subtotal(it))}</strong></td>
                <td>
                  <button type="button" className="rincian-del" onClick={() => hapus(i)} aria-label="Hapus item">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-soft btn-block" onClick={() => onChange([...items, itemBaru()])}>
        + {labelTambah}
      </button>
      <div className="item-total">
        <span>Total</span>
        <strong>{rupiah(totalItems(items))}</strong>
      </div>
    </div>
  );
}
