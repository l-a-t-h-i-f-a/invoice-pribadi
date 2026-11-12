import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { addItem, deleteItem } from '../services/db';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Badge, Empty, ErrorBox, Field, PageHeader, StatCard } from '../components/ui';
import { hariIni, inisial, namaBulan, num, rupiah, tanggal } from '../utils/format';
import { ringkasPiutang } from '../utils/piutang';

const kosong = { tanggal: hariIni(), nominal: '', catatan: '' };

export default function PiutangGaji() {
  const karyawan = useCollection('karyawan');
  const slip = useCollection('slipGaji');
  const pelunasan = useCollection('pelunasanGaji');
  const [bayarKe, setBayarKe] = useState(null); // baris karyawan yang sedang dilunasi
  const [riwayat, setRiwayat] = useState(null); // baris karyawan yang riwayatnya dibuka
  const [form, setForm] = useState(kosong);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () =>
      karyawan.data
        .map((k) => ({ k, ...ringkasPiutang(k.id, slip.data, pelunasan.data) }))
        .sort((a, b) => b.sisa - a.sisa),
    [karyawan.data, slip.data, pelunasan.data],
  );

  const stat = useMemo(
    () => ({
      ditunda: rows.reduce((a, r) => a + r.ditunda, 0),
      dilunasi: rows.reduce((a, r) => a + r.dilunasi, 0),
      sisa: rows.reduce((a, r) => a + r.sisa, 0),
      nBelum: rows.filter((r) => r.sisa > 0).length,
    }),
    [rows],
  );

  // Ambil ulang dari rows supaya isi modal ikut realtime
  const detail = riwayat && rows.find((r) => r.k.id === riwayat);
  const target = bayarKe && rows.find((r) => r.k.id === bayarKe);

  const bukaBayar = (r) => {
    setForm({ ...kosong, tanggal: hariIni(), nominal: r.sisa });
    setBayarKe(r.k.id);
  };
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const simpanBayar = async (e) => {
    e.preventDefault();
    const nominal = num(form.nominal);
    if (nominal <= 0) return alert('Nominal pelunasan harus lebih dari 0');
    if (nominal > target.sisa) return alert(`Nominal melebihi sisa piutang (${rupiah(target.sisa)})`);
    setSaving(true);
    try {
      await addItem('pelunasanGaji', {
        karyawanId: target.k.id,
        nama: target.k.nama,
        tanggal: form.tanggal,
        nominal,
        catatan: form.catatan.trim(),
      });
      setBayarKe(null);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const hapusBayar = async (p) => {
    if (!window.confirm(`Hapus pelunasan ${rupiah(p.nominal)} tanggal ${tanggal(p.tanggal)}?`)) return;
    await deleteItem('pelunasanGaji', p.id).catch((err) => alert(err.message));
  };

  const loading = karyawan.loading || slip.loading || pelunasan.loading;

  return (
    <>
      <PageHeader title="Piutang Gaji 🤝" subtitle="Gaji karyawan yang ditunda dan pelunasannya" />

      <div className="stats">
        <StatCard icon="🤝" label="Total gaji ditunda" value={rupiah(stat.ditunda)} sub={`${rows.length} karyawan`} />
        <StatCard icon="✅" tone="green" label="Sudah dilunasi" value={rupiah(stat.dilunasi)} />
        <StatCard icon="⏳" tone="yellow" label="Sisa piutang" value={rupiah(stat.sisa)} sub={`${stat.nBelum} karyawan belum lunas`} />
        <StatCard icon="💡" tone="purple" label="Cara mencatat" value="Slip Gaji" sub="isi “Gaji ditunda” di slip gaji" />
      </div>

      <div className="card">
        <ErrorBox error={karyawan.error || slip.error || pelunasan.error} />
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty icon="🤝" teks="Belum ada data karyawan." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th className="num">Gaji Ditunda</th>
                  <th className="num">Dilunasi</th>
                  <th className="num">Sisa Piutang</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.k.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{inisial(r.k.nama)}</span>
                        <div>
                          <strong>{r.k.nama}</strong>
                          <small>{r.k.jabatan}</small>
                        </div>
                      </div>
                    </td>
                    <td className="num">{rupiah(r.ditunda)}</td>
                    <td className="num text-green">{rupiah(r.dilunasi)}</td>
                    <td className="num"><strong>{rupiah(r.sisa)}</strong></td>
                    <td>
                      {r.ditunda === 0 ? (
                        <Badge tone="gray">Tidak ada</Badge>
                      ) : r.sisa === 0 ? (
                        <Badge tone="green">✓ Lunas</Badge>
                      ) : (
                        <Badge tone="yellow">⏳ Belum lunas</Badge>
                      )}
                    </td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setRiwayat(r.k.id)}>Riwayat</button>
                      <button className="btn btn-primary btn-sm" onClick={() => bukaBayar(r)} disabled={r.sisa <= 0}>
                        Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(target)} title="Bayar Piutang Gaji 💸" onClose={() => setBayarKe(null)}>
        {target && (
          <form onSubmit={simpanBayar}>
            <p className="muted">
              Pelunasan untuk <strong>{target.k.nama}</strong>. Sisa piutang: <strong>{rupiah(target.sisa)}</strong>
            </p>
            <div className="form-grid">
              <Field label="Tanggal bayar"><input name="tanggal" type="date" required value={form.tanggal} onChange={set} /></Field>
              <Field label="Nominal">
                <input name="nominal" type="number" min="1" max={target.sisa} required value={form.nominal} onChange={set} />
              </Field>
            </div>
            <Field label="Catatan" full>
              <textarea name="catatan" rows="2" value={form.catatan} onChange={set} placeholder="mis. Transfer BCA" />
            </Field>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setBayarKe(null)}>Batal</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan 💾'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(detail)} title={`Riwayat Piutang — ${detail?.k.nama || ''}`} onClose={() => setRiwayat(null)} wide>
        {detail && (
          <>
            <div className="summary">
              <div><span>Total gaji ditunda</span><strong>{rupiah(detail.ditunda)}</strong></div>
              <div><span>Sudah dilunasi</span><strong className="text-green">{rupiah(detail.dilunasi)}</strong></div>
              <div className="summary-main"><span>Sisa piutang</span><strong>{rupiah(detail.sisa)}</strong></div>
            </div>

            <h3>Gaji ditunda per periode</h3>
            {detail.slipDitunda.length === 0 ? (
              <Empty icon="💌" teks="Belum ada slip dengan gaji ditunda." />
            ) : (
              <ul className="mini-list">
                {[...detail.slipDitunda]
                  .sort((a, b) => String(b.periode).localeCompare(String(a.periode)))
                  .map((s) => (
                    <li key={s.id}>
                      <div>
                        <strong>{namaBulan(s.periode)}</strong>
                        <small>Gaji bersih {rupiah(s.gajiBersih)}</small>
                      </div>
                      <div className="right">
                        <strong>{rupiah(s.ditunda)}</strong>
                        <small>ditunda</small>
                      </div>
                    </li>
                  ))}
              </ul>
            )}

            <h3>Pelunasan</h3>
            {detail.bayar.length === 0 ? (
              <Empty icon="💸" teks="Belum ada pelunasan." />
            ) : (
              <ul className="mini-list">
                {[...detail.bayar]
                  .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
                  .map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{tanggal(p.tanggal)}</strong>
                        <small>{p.catatan || '-'}</small>
                      </div>
                      <div className="right">
                        <strong className="text-green">{rupiah(p.nominal)}</strong>
                        <button className="icon-btn" title="Hapus" onClick={() => hapusBayar(p)}>🗑️</button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
