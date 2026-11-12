import { useMemo, useState } from 'react';

const bandingkan = (a, b) =>
  typeof a === 'number' && typeof b === 'number' ? a - b : String(a ?? '').localeCompare(String(b ?? ''), 'id');

// Tabel dengan pencarian, jumlah baris per halaman, urut kolom & paginasi.
// columns: [{ key, label, value?: (row) => any, render?: (row, index) => node, className?, sortable? }]
export default function DataTable({ columns, rows, rowKey = (r) => r.id, empty = 'Tidak ada data' }) {
  const [q, setQ] = useState('');
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const nilai = (c, r) => (c.value ? c.value(r) : r[c.key]);

  const hasil = useMemo(() => {
    const cari = q.toLowerCase();
    let out = rows.map((r, i) => ({ r, i }));
    if (cari) {
      out = out.filter(({ r }) =>
        columns.some((c) => c.key !== '#' && String(nilai(c, r) ?? '').toLowerCase().includes(cari)),
      );
    }
    const col = columns.find((c) => c.key === sort.key);
    if (col) out = [...out].sort((a, b) => bandingkan(nilai(col, a.r), nilai(col, b.r)) * sort.dir);
    return out;
  }, [rows, q, sort, columns]);

  const pages = Math.max(1, Math.ceil(hasil.length / size));
  const cur = Math.min(page, pages);
  const shown = hasil.slice((cur - 1) * size, cur * size);

  const klikSort = (c) => {
    if (c.sortable === false) return;
    setSort((s) => (s.key === c.key ? { key: c.key, dir: -s.dir } : { key: c.key, dir: 1 }));
  };

  return (
    <div className="dt">
      <div className="dt-top">
        <label className="dt-size">
          Tampilkan
          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          baris
        </label>
        <input className="dt-search" placeholder="🔍 Cari..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${c.className || ''} ${c.sortable === false ? '' : 'sortable'}`}
                  onClick={() => klikSort(c)}
                >
                  {c.label}
                  {c.sortable !== false && (
                    <span className="sort-ind">{sort.key === c.key ? (sort.dir > 0 ? '▲' : '▼') : '⇅'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={columns.length} className="dt-empty">{empty}</td></tr>
            ) : (
              shown.map(({ r, i }) => (
                <tr key={rowKey(r, i)}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.render ? c.render(r, i) : c.key === '#' ? i + 1 : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="dt-bottom">
        <span className="muted">
          {hasil.length ? `Menampilkan ${(cur - 1) * size + 1}–${(cur - 1) * size + shown.length} dari ${hasil.length} data` : '0 data'}
        </span>
        <div className="dt-pages">
          <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>‹ Sebelumnya</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button type="button" key={p} className={p === cur ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Berikutnya ›</button>
        </div>
      </div>
    </div>
  );
}
