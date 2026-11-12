import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollection } from '../hooks/useCollection';
import { addItem, addMany, deleteItem, updateItem } from '../services/db';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Badge, Empty, ErrorBox, Field, PageHeader } from '../components/ui';
import RincianList, { barisBaru } from '../components/RincianList';
import { bulanIni, inisial, namaBulan, num, rupiah } from '../utils/format';
import { bersihkanItems, hitungSlip, rincian } from '../utils/slip';
import { batasDitunda } from '../utils/piutang';

const kosong = {
  karyawanId: '', periode: bulanIni(), gajiPokok: '', pendapatan: [], potongan: [], ditunda: '', status: 'Draft', catatan: '',
};

const dataKaryawan = (k) => ({
  karyawanId: k.id,
  nama: k.nama,
  jabatan: k.jabatan,
  departemen: k.departemen || '',
  bank: k.bank || '',
  noRekening: k.noRekening || '',
});

export default function SlipGaji() {
  const slip = useCollection('slipGaji');
  const karyawan = useCollection('karyawan');
  const [periode, setPeriode] = useState(bulanIni());
  const [cari, setCari] = useState('');
  const [form, setForm] = useState(kosong);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [openMassal, setOpenMassal] = useState(false);
  const [periodeMassal, setPeriodeMassal] = useState(bulanIni());
  const [saving, setSaving] = useState(false);

  const aktif = karyawan.data.filter((k) => k.status !== 'Nonaktif');

  const list = useMemo(() => {
    const q = cari.toLowerCase();
    return slip.data.filter(
      (s) =>
        (!periode || s.periode === periode) &&
        [s.nama, s.jabatan, s.departemen].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [slip.data, periode, cari]);

  const total = list.reduce((a, s) => a + num(s.gajiBersih), 0);
  const hasil = hitungSlip(form.gajiPokok, form.pendapatan, form.potongan);
  const ditunda = batasDitunda(form.ditunda, hasil.gajiBersih);

  const bukaTambah = () => {
    setForm({ ...kosong, periode: periode || bulanIni(), pendapatan: [barisBaru()], potongan: [barisBaru()] });
    setEditId(null);
    setOpen(true);
  };
  const bukaEdit = (s) => {
    const r = rincian(s);
    setForm({
      ...kosong,
      ...s,
      pendapatan: r.pendapatan.map((it) => barisBaru(it)),
      potongan: r.potongan.map((it) => barisBaru(it)),
    });
    setEditId(s.id);
    setOpen(true);
  };
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pilihKaryawan = (e) => {
    const k = karyawan.data.find((x) => x.id === e.target.value);
    if (!k) return setForm({ ...form, karyawanId: '' });
    setForm({
      ...form,
      karyawanId: k.id,
      gajiPokok: k.gajiPokok ?? 0,
    });
  };

  const simpan = async (e) => {
    e.preventDefault();
    const k = karyawan.data.find((x) => x.id === form.karyawanId);
    const duplikat = slip.data.find(
      (s) => s.karyawanId === form.karyawanId && s.periode === form.periode && s.id !== editId,
    );
    if (duplikat && !window.confirm('Karyawan ini sudah punya slip di periode yang sama. Tetap simpan?')) return;

    setSaving(true);
    const pendapatan = bersihkanItems(form.pendapatan);
    const potongan = bersihkanItems(form.potongan);
    const payload = {
      ...(k ? dataKaryawan(k) : {}),
      periode: form.periode,
      gajiPokok: num(form.gajiPokok),
      pendapatan,
      potongan,
      status: form.status,
      catatan: form.catatan,
      ...hitungSlip(form.gajiPokok, pendapatan, potongan),
      ditunda,
    };
    try {
      if (editId) await updateItem('slipGaji', editId, payload);
      else await addItem('slipGaji', payload);
      setOpen(false);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const buatMassal = async () => {
    const sudahAda = new Set(slip.data.filter((s) => s.periode === periodeMassal).map((s) => s.karyawanId));
    const target = aktif.filter((k) => !sudahAda.has(k.id));
    if (!target.length) {
      alert('Semua karyawan aktif sudah punya slip di periode ini 💕');
      return;
    }
    setSaving(true);
    try {
      await addMany(
        'slipGaji',
        target.map((k) => {
          const gajiPokok = num(k.gajiPokok);
          return {
            ...dataKaryawan(k),
            gajiPokok,
            pendapatan: [],
            potongan: [],
            ...hitungSlip(gajiPokok, [], []),
            periode: periodeMassal,
            status: 'Draft',
            catatan: '',
          };
        }),
      );
      setPeriode(periodeMassal);
      setOpenMassal(false);
      alert(`${target.length} slip gaji berhasil dibuat ✨`);
    } catch (err) {
      alert(`Gagal membuat slip: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleBayar = (s) =>
    updateItem('slipGaji', s.id, { status: s.status === 'Dibayar' ? 'Draft' : 'Dibayar' }).catch((err) =>
      alert(err.message),
    );

  const hapus = async (s) => {
    if (!window.confirm(`Hapus slip gaji ${s.nama} (${namaBulan(s.periode)})?`)) return;
    await deleteItem('slipGaji', s.id).catch((err) => alert(err.message));
  };

  const loading = slip.loading || karyawan.loading;

  return (
    <>
      <PageHeader title="Slip Gaji 💌" subtitle="Kelola dan cetak slip gaji karyawan">
        <button className="btn btn-soft" onClick={() => setOpenMassal(true)}>✨ Buat Massal</button>
        <button className="btn btn-primary" onClick={bukaTambah}>+ Buat Slip</button>
      </PageHeader>

      <div className="card">
        <div className="toolbar">
          <input className="search" placeholder="🔍 Cari nama / jabatan..." value={cari} onChange={(e) => setCari(e.target.value)} />
          <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Periode" />
          <button className="btn btn-ghost btn-sm" onClick={() => setPeriode('')}>Semua periode</button>
          <div className="toolbar-total">
            Total gaji bersih: <strong>{rupiah(total)}</strong>
          </div>
        </div>
        <ErrorBox error={slip.error || karyawan.error} />
        {loading ? (
          <Loader />
        ) : list.length === 0 ? (
          <Empty icon="💌" teks="Belum ada slip gaji untuk filter ini." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Periode</th>
                  <th className="num">Pendapatan</th>
                  <th className="num">Potongan</th>
                  <th className="num">Gaji Bersih</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{inisial(s.nama)}</span>
                        <div>
                          <strong>{s.nama}</strong>
                          <small>{s.jabatan}</small>
                        </div>
                      </div>
                    </td>
                    <td>{namaBulan(s.periode)}</td>
                    <td className="num">{rupiah(s.totalPendapatan)}</td>
                    <td className="num text-red">−{rupiah(s.totalPotongan)}</td>
                    <td className="num">
                      <strong>{rupiah(s.gajiBersih)}</strong>
                      {num(s.ditunda) > 0 && <small className="muted block">🤝 ditunda {rupiah(s.ditunda)}</small>}
                    </td>
                    <td>
                      <button className="badge-btn" onClick={() => toggleBayar(s)} title="Klik untuk ubah status">
                        <Badge tone={s.status === 'Dibayar' ? 'green' : 'yellow'}>
                          {s.status === 'Dibayar' ? '✓ Dibayar' : '⏳ Draft'}
                        </Badge>
                      </button>
                    </td>
                    <td className="actions">
                      <Link className="icon-btn" title="Cetak" to={`/slip-gaji/${s.id}/cetak`}>🖨️</Link>
                      <button className="icon-btn" title="Ubah" onClick={() => bukaEdit(s)}>✏️</button>
                      <button className="icon-btn" title="Hapus" onClick={() => hapus(s)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} title={editId ? 'Ubah Slip Gaji ✏️' : 'Buat Slip Gaji 💌'} onClose={() => setOpen(false)} wide="xl">
        <form onSubmit={simpan}>
          <div className="form-grid">
            <Field label="Karyawan">
              <select name="karyawanId" required value={form.karyawanId} onChange={pilihKaryawan}>
                <option value="">— pilih karyawan —</option>
                {karyawan.data.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}{k.jabatan ? ` — ${k.jabatan}` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Periode"><input name="periode" type="month" required value={form.periode} onChange={set} /></Field>
          </div>

          <div className="form-grid form-grid-3">
            <Field label="Gaji pokok" hint="Otomatis dari data karyawan, bisa diubah">
              <input name="gajiPokok" type="number" min="0" value={form.gajiPokok} onChange={set} />
            </Field>
            <Field label="Status">
              <select name="status" value={form.status} onChange={set}>
                <option>Draft</option>
                <option>Dibayar</option>
              </select>
            </Field>
            <Field label="Gaji ditunda (piutang)" hint="Opsional — dicatat di Piutang Gaji">
              <input name="ditunda" type="number" min="0" max={Math.max(hasil.gajiBersih, 0)} value={form.ditunda} onChange={set} />
            </Field>
          </div>

          <div className="rincian-grid">
            <RincianList
              judul="Pendapatan"
              icon="↑"
              tone="green"
              items={form.pendapatan}
              onChange={(pendapatan) => setForm({ ...form, pendapatan })}
              placeholder="mis. Tunjangan Jabatan"
              labelTambah="Tambah Pendapatan"
            />
            <RincianList
              judul="Potongan"
              icon="↓"
              tone="red"
              items={form.potongan}
              onChange={(potongan) => setForm({ ...form, potongan })}
              placeholder="mis. Potongan BPJS"
              labelTambah="Tambah Potongan"
            />
          </div>

          <Field label="Catatan" full>
            <textarea name="catatan" rows="2" value={form.catatan} onChange={set} />
          </Field>

          <div className="summary">
            <div><span>Gaji pokok + pendapatan</span><strong>{rupiah(hasil.totalPendapatan)}</strong></div>
            <div><span>Total potongan</span><strong className="text-red">−{rupiah(hasil.totalPotongan)}</strong></div>
            <div className="summary-main"><span>Gaji bersih</span><strong>{rupiah(hasil.gajiBersih)}</strong></div>
            {ditunda > 0 && (
              <>
                <div><span>Gaji ditunda (piutang)</span><strong className="text-red">−{rupiah(ditunda)}</strong></div>
                <div><span>Dibayarkan sekarang</span><strong>{rupiah(hasil.gajiBersih - ditunda)}</strong></div>
              </>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan 💾'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={openMassal} title="Buat Slip Massal ✨" onClose={() => setOpenMassal(false)}>
        <p className="muted">
          Buat slip gaji untuk semua <strong>{aktif.length} karyawan aktif</strong> sekaligus, memakai gaji pokok dari data
          karyawan. Karyawan yang sudah punya slip di periode tersebut akan dilewati.
        </p>
        <Field label="Periode">
          <input type="month" value={periodeMassal} onChange={(e) => setPeriodeMassal(e.target.value)} />
        </Field>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={() => setOpenMassal(false)}>Batal</button>
          <button className="btn btn-primary" disabled={saving || !periodeMassal} onClick={buatMassal}>
            {saving ? 'Membuat...' : 'Buat Sekarang 🚀'}
          </button>
        </div>
      </Modal>
    </>
  );
}
