import { rupiah } from '../utils/format';
import { totalItems } from '../utils/slip';

let seq = 0;
export const barisBaru = (it = {}) => ({ keterangan: '', nominal: '', ...it, _k: ++seq });

export function RupiahInput({ value, onChange }) {
  const tampil = value === '' || value == null ? '' : Number(value).toLocaleString('id-ID');
  return (
    <div className="rp-input">
      <span>Rp</span>
      <input
        inputMode="numeric"
        placeholder="0"
        aria-label="Nominal"
        value={tampil}
        onChange={(e) => {
          const angka = e.target.value.replace(/\D/g, '');
          onChange(angka === '' ? '' : Number(angka));
        }}
      />
    </div>
  );
}

export default function RincianList({ judul, icon, tone, items, onChange, placeholder, labelTambah }) {
  const ubah = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const hapus = (i) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className={`rincian rincian-${tone}`}>
      <div className="rincian-head">
        <h4><span className="rincian-icon">{icon}</span> {judul}</h4>
        <span className="rincian-total">{rupiah(totalItems(items))}</span>
      </div>
      <div className="rincian-body">
        {items.length > 0 ? (
          <div className="rincian-cols">
            <span>Keterangan</span>
            <span>Nominal</span>
          </div>
        ) : (
          <p className="rincian-empty">Belum ada item</p>
        )}
        {items.map((it, i) => (
          <div className="rincian-row" key={it._k}>
            <input
              placeholder={placeholder}
              aria-label="Keterangan"
              value={it.keterangan}
              onChange={(e) => ubah(i, { keterangan: e.target.value })}
            />
            <RupiahInput value={it.nominal} onChange={(v) => ubah(i, { nominal: v })} />
            <button type="button" className="rincian-del" onClick={() => hapus(i)} aria-label="Hapus baris">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-block rincian-add" onClick={() => onChange([...items, barisBaru()])}>
          + {labelTambah}
        </button>
      </div>
    </div>
  );
}
