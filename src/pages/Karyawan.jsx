import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { addItem, deleteKaryawan, updateItem } from '../services/db';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Badge, Empty, ErrorBox, Field, PageHeader } from '../components/ui';
import { inisial, num, rupiah, tanggal } from '../utils/format';
import { formatNip, nomorTerakhir } from '../utils/nip';

const kosong = {
  nip: '', nama: '', jabatan: '', departemen: '', email: '', telepon: '',
  gajiPokok: '', bank: '', noRekening: '', tanggalMasuk: '', status: 'Aktif',
};

export default function Karyawan() {
  const { data, loading, error } = useCollection('karyawan');
  const [cari, setCari] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const q = cari.toLowerCase();
    return data.filter(
      (k) =>
        (filterStatus === 'Semua' || k.status === filterStatus) &&
        [k.nama, k.nip, k.jabatan, k.departemen].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [data, cari, filterStatus]);

  const bukaTambah = () => {
    setForm({ ...kosong, nip: formatNip('EMP', nomorTerakhir(data, 'EMP') + 1) });
    setEditId(null);
    setOpen(true);
  };
  const bukaEdit = (k) => {
    setForm({ ...kosong, ...k });
    setEditId(k.id);
    setOpen(true);
  };
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const simpan = async (e) => {
    e.preventDefault();
    setSaving(true);
    // tunjangan dibuang agar field lama dari data sebelumnya tidak ikut tersimpan
    const { id, createdAt, updatedAt, tunjangan, ...rest } = form;
    const payload = { ...rest, gajiPokok: num(form.gajiPokok) };
    try {
      if (editId) await updateItem('karyawan', editId, payload);
      else await addItem('karyawan', payload);
      setOpen(false);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const hapusSemua = async () => {
    const ketik = window.prompt(
      `Hapus SEMUA ${data.length} data karyawan beserta slip gajinya? Tindakan ini tidak bisa dibatalkan.

Ketik HAPUS untuk melanjutkan:`,
    );
    if (ketik?.trim().toUpperCase() !== 'HAPUS') return;
    setBusy(true);
    try {
      const nSlip = await deleteKaryawan(data.map((k) => k.id));
      alert(`Semua data karyawan sudah dihapus 🧹 (${nSlip} slip gaji ikut terhapus)`);
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (k) => {
    if (!window.confirm(`Hapus data karyawan ${k.nama}? Semua slip gajinya juga ikut terhapus.`)) return;
    try {
      await deleteKaryawan([k.id]);
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <>
      <PageHeader title="Data Karyawan 👩‍💼" subtitle={`${data.length} karyawan terdaftar`}>
        {import.meta.env.DEV && (
          <button className="btn btn-danger-soft" onClick={hapusSemua} disabled={busy || loading || !data.length}>
            🗑️ Hapus Semua
          </button>
        )}
        <button className="btn btn-primary" onClick={bukaTambah}>+ Tambah Karyawan</button>
      </PageHeader>

      <div className="card">
        <div className="toolbar">
          <input className="search" placeholder="🔍 Cari nama, NIP, jabatan..." value={cari} onChange={(e) => setCari(e.target.value)} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>Semua</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loader />
        ) : list.length === 0 ? (
          <Empty teks={data.length ? 'Tidak ada yang cocok dengan pencarian.' : 'Belum ada karyawan. Yuk tambahkan yang pertama!'} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jabatan</th>
                  <th>Kontak</th>
                  <th className="num">Gaji Pokok</th>
                  <th>Masuk</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{inisial(k.nama)}</span>
                        <div>
                          <strong>{k.nama}</strong>
                          <small>{k.nip || '-'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {k.jabatan}
                      <small className="muted block">{k.departemen}</small>
                    </td>
                    <td>
                      {k.email || '-'}
                      <small className="muted block">{k.telepon}</small>
                    </td>
                    <td className="num">{rupiah(k.gajiPokok)}</td>
                    <td>{tanggal(k.tanggalMasuk)}</td>
                    <td>
                      <Badge tone={k.status === 'Aktif' ? 'green' : 'gray'}>{k.status}</Badge>
                    </td>
                    <td className="actions">
                      <button className="icon-btn" title="Ubah" onClick={() => bukaEdit(k)}>✏️</button>
                      <button className="icon-btn" title="Hapus" onClick={() => hapus(k)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} title={editId ? 'Ubah Karyawan ✏️' : 'Tambah Karyawan 🌷'} onClose={() => setOpen(false)} wide>
        <form onSubmit={simpan}>
          <div className="form-grid">
            <Field label="NIP"><input name="nip" required value={form.nip} onChange={set} /></Field>
            <Field label="Nama lengkap"><input name="nama" required value={form.nama} onChange={set} /></Field>
            <Field label="Jabatan"><input name="jabatan" required value={form.jabatan} onChange={set} /></Field>
            <Field label="Departemen"><input name="departemen" value={form.departemen} onChange={set} /></Field>
            <Field label="Email"><input name="email" type="email" value={form.email} onChange={set} /></Field>
            <Field label="No. telepon"><input name="telepon" value={form.telepon} onChange={set} /></Field>
            <Field label="Gaji pokok (Rp)"><input name="gajiPokok" type="number" min="0" required value={form.gajiPokok} onChange={set} /></Field>
            <Field label="Bank"><input name="bank" placeholder="BCA / BRI / Mandiri..." value={form.bank} onChange={set} /></Field>
            <Field label="No. rekening"><input name="noRekening" value={form.noRekening} onChange={set} /></Field>
            <Field label="Tanggal masuk"><input name="tanggalMasuk" type="date" value={form.tanggalMasuk} onChange={set} /></Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={set}>
                <option>Aktif</option>
                <option>Nonaktif</option>
              </select>
            </Field>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan 💾'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
