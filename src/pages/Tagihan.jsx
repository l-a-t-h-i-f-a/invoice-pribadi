import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '../hooks/useCollection';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import FormPenerima from '../components/FormPenerima';
import { Badge, Empty, ErrorBox, PageHeader, StatCard } from '../components/ui';
import { rupiah, tanggal, waktuWib } from '../utils/format';
import { invoicesTagihan, invoiceTelat, lokasi, namaPenerima, ringkas, STATUS, telat, toneStatus } from '../utils/tagihan';

export default function Tagihan() {
  const navigate = useNavigate();
  const { data, loading, error } = useCollection('tagihan');
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [openBaru, setOpenBaru] = useState(false);

  const rows = useMemo(() => data.map((t) => ({ t, r: ringkas(t) })), [data]);

  const stat = useMemo(
    () => ({
      total: rows.reduce((a, x) => a + x.r.total, 0),
      dibayar: rows.reduce((a, x) => a + x.r.dibayar, 0),
      sisa: rows.reduce((a, x) => a + x.r.sisa, 0),
      nBelum: rows.filter((x) => x.r.status !== STATUS.lunas).length,
      nTelat: data.flatMap(invoicesTagihan).filter(invoiceTelat).length,
    }),
    [rows, data],
  );

  const list = useMemo(() => {
    const q = cari.toLowerCase();
    return rows.filter(({ t, r }) => {
      const cocok = filter === 'Semua' || (filter === 'Terlambat' ? telat(t) : r.status === filter);
      return (
        cocok &&
        [t.nomor, namaPenerima(t), t.kota, t.provinsi, t.email, t.telepon].some((v) =>
          String(v || '').toLowerCase().includes(q),
        )
      );
    });
  }, [rows, cari, filter]);

  // Data penerima belum disimpan — dibawa ke halaman Tagihan Baru untuk diisi item dulu
  const buatDraft = async (penerima) => navigate('/tagihan/baru', { state: { penerima } });

  return (
    <>
      <PageHeader title="Data Tagihan 🧾" subtitle="Catat tagihan, buat invoice, dan pantau pembayaran">
        <button className="btn btn-primary" onClick={() => setOpenBaru(true)}>+ Tambah Tagihan</button>
      </PageHeader>

      <div className="stats">
        <StatCard icon="🧾" label="Total nilai tagihan" value={rupiah(stat.total)} sub={`${data.length} tagihan`} />
        <StatCard icon="✅" tone="green" label="Sudah dibayar" value={rupiah(stat.dibayar)} />
        <StatCard icon="⏳" tone="yellow" label="Sisa belum dibayar" value={rupiah(stat.sisa)} sub={`${stat.nBelum} tagihan belum lunas`} />
        <StatCard icon="⚠️" tone="red" label="Invoice terlambat" value={stat.nTelat} sub="lewat tenggat" />
      </div>

      <div className="card">
        <div className="toolbar">
          <input className="search" placeholder="🔍 Cari nomor, penerima, kota..." value={cari} onChange={(e) => setCari(e.target.value)} />
          <div className="chips">
            {['Semua', STATUS.belum, STATUS.sebagian, STATUS.lunas, 'Terlambat'].map((f) => (
              <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loader />
        ) : list.length === 0 ? (
          <Empty icon="🧾" teks="Belum ada tagihan di sini." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Tagihan</th>
                  <th>Penerima</th>
                  <th>Kontak</th>
                  <th className="num">Total</th>
                  <th className="num">Dibayar</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map(({ t, r }) => (
                  <tr key={t.id} className={`row-link ${telat(t) ? 'row-late' : ''}`} onClick={() => navigate(`/tagihan/${t.id}`)}>
                    <td>
                      <strong>{t.nomor}</strong>
                      <small className="muted block">{tanggal(t.tanggal)}</small>
                    </td>
                    <td>
                      {namaPenerima(t)}
                      <small className="muted block">{lokasi(t) || '-'}</small>
                    </td>
                    <td>
                      {t.telepon || '-'}
                      <small className="muted block">{t.email}</small>
                    </td>
                    <td className="num"><strong>{rupiah(r.total)}</strong></td>
                    <td className="num">{rupiah(r.dibayar)}</td>
                    <td>
                      <Badge tone={toneStatus[r.status]}>{r.status}</Badge>
                      {telat(t) && <small className="text-red block">⚠️ Ada invoice terlambat</small>}
                    </td>
                    <td className="nowrap">
                      {(() => {
                        // updatedAt kosong untuk tagihan yang belum pernah diubah -> pakai waktu dibuat
                        const w = waktuWib(t.updatedAt || t.createdAt);
                        return w ? (
                          <>
                            {w.tanggal}
                            <small className="muted block">{w.jam}</small>
                          </>
                        ) : (
                          <small className="muted">baru saja</small>
                        );
                      })()}
                    </td>
                    <td className="actions">
                      <button className="btn btn-soft btn-sm">Detail →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={openBaru} title="Tambah Tagihan 🧾" onClose={() => setOpenBaru(false)} wide>
        {openBaru && <FormPenerima labelSimpan="Buat Draft 📝" onBatal={() => setOpenBaru(false)} onSimpan={buatDraft} />}
      </Modal>
    </>
  );
}
