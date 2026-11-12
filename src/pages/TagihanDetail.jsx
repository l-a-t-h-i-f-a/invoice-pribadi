import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCollection } from '../hooks/useCollection';
import { deleteItem, updateItem } from '../services/db';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import InfoTagihan from '../components/InfoTagihan';
import FormPenerima from '../components/FormPenerima';
import ItemEditor, { bersihkanBhp, bersihkanItemTagihan, itemBaru } from '../components/ItemEditor';
import { RupiahInput } from '../components/RincianList';
import { Badge, Empty, ErrorBox, Field } from '../components/ui';
import { hariIni, num, rupiah, tanggal } from '../utils/format';
import {
  bhpTagihan, idAcak, invoiceTelat, JENIS_INVOICE, nomorInvoiceBaru, ringkas, subtotal, toneStatus, totalItems,
} from '../utils/tagihan';

const kolomItem = [
  { key: '#', label: '#', value: (r) => r._i },
  { key: 'nama', label: 'Nama Item' },
  { key: 'harga', label: 'Harga', className: 'num', render: (r) => rupiah(r.harga) },
  { key: 'qty', label: 'Qty', className: 'num' },
  { key: 'subtotal', label: 'Subtotal', className: 'num', value: subtotal, render: (r) => <strong>{rupiah(subtotal(r))}</strong> },
];

const kolomBhp = [
  { key: '#', label: '#', value: (r) => r._i },
  { key: 'nama', label: 'Nama Barang' },
  { key: 'harga', label: 'Harga', className: 'num', render: (r) => rupiah(r.harga) },
  { key: 'qty', label: 'Qty', className: 'num' },
  { key: 'satuan', label: 'Satuan', render: (r) => r.satuan || '-' },
  { key: 'subtotal', label: 'Subtotal', className: 'num', value: subtotal, render: (r) => <strong>{rupiah(subtotal(r))}</strong> },
];

function FormInvoice({ sisa, onBatal, onSimpan }) {
  const [f, setF] = useState({ jenis: 'DP', jumlah: '', tanggal: hariIni(), tenggat: '' });
  const [saving, setSaving] = useState(false);
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (num(f.jumlah) <= 0) return alert('Isi jumlah invoice dulu ya 🎀');
    if (num(f.jumlah) > sisa && !window.confirm(`Jumlah melebihi sisa yang belum ditagih (${rupiah(sisa)}). Tetap lanjut?`)) return undefined;
    setSaving(true);
    try {
      await onSimpan({ ...f, jumlah: num(f.jumlah) });
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
      setSaving(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={submit}>
      <p className="muted">Sisa yang belum ditagih: <strong>{rupiah(sisa)}</strong></p>
      <div className="form-grid">
        <Field label="Jenis *">
          <select
            name="jenis"
            value={f.jenis}
            onChange={(e) => setF({ ...f, jenis: e.target.value, jumlah: e.target.value === 'Pelunasan' ? sisa : f.jumlah })}
          >
            {JENIS_INVOICE.map((j) => <option key={j}>{j}</option>)}
          </select>
        </Field>
        <Field label="Jumlah *">
          <RupiahInput value={f.jumlah} onChange={(v) => setF({ ...f, jumlah: v })} />
        </Field>
        <Field label="Tanggal *"><input name="tanggal" type="date" required value={f.tanggal} onChange={set} /></Field>
        <Field label="Tenggat *"><input name="tenggat" type="date" required min={f.tanggal} value={f.tenggat} onChange={set} /></Field>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-ghost" onClick={onBatal}>Batal</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Buat Invoice 🧾'}</button>
      </div>
    </form>
  );
}

export default function TagihanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useCollection('tagihan');
  const [editItems, setEditItems] = useState(null);
  const [editBhp, setEditBhp] = useState(null);
  const [openPenerima, setOpenPenerima] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader />;
  const t = data.find((x) => x.id === id);
  if (!t) {
    return (
      <>
        <ErrorBox error={error} />
        <Empty icon="😿" teks="Tagihan tidak ditemukan." />
        <div style={{ textAlign: 'center' }}><Link className="btn btn-primary" to="/tagihan">← Kembali</Link></div>
      </>
    );
  }

  const r = ringkas(t);
  const bhp = bhpTagihan(t);
  const simpanInvoices = (invoices) => updateItem('tagihan', t.id, { invoices });

  const simpanItems = async () => {
    const bersih = bersihkanItemTagihan(editItems);
    if (!bersih.length) return alert('Minimal harus ada satu item 🎀');
    setSaving(true);
    try {
      await updateItem('tagihan', t.id, { items: bersih });
      setEditItems(null);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const simpanBhp = async () => {
    setSaving(true);
    try {
      await updateItem('tagihan', t.id, { bhp: bersihkanBhp(editBhp) });
      setEditBhp(null);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const buatInvoice = async (f) => {
    const { seq, nomor } = nomorInvoiceBaru(data, f.jenis, f.tanggal);
    await simpanInvoices([...r.invoices, { id: idAcak(), seq, nomor, ...f, tglBayar: '' }]);
    setOpenInvoice(false);
  };

  const bayar = (inv) => {
    if (!window.confirm(`Tandai ${inv.nomor} sudah dibayar hari ini?`)) return;
    simpanInvoices(r.invoices.map((i) => (i.id === inv.id ? { ...i, tglBayar: hariIni() } : i))).catch((e) => alert(e.message));
  };
  const batalBayar = (inv) => {
    if (!window.confirm(`Batalkan status bayar ${inv.nomor}?`)) return;
    simpanInvoices(r.invoices.map((i) => (i.id === inv.id ? { ...i, tglBayar: '' } : i))).catch((e) => alert(e.message));
  };
  const hapusInvoice = (inv) => {
    if (!window.confirm(`Hapus invoice ${inv.nomor}?`)) return;
    simpanInvoices(r.invoices.filter((i) => i.id !== inv.id)).catch((e) => alert(e.message));
  };
  const hapusTagihan = async () => {
    if (!window.confirm(`Hapus tagihan ${t.nomor} beserta semua invoicenya?`)) return;
    await deleteItem('tagihan', t.id);
    navigate('/tagihan', { replace: true });
  };

  const kolomInvoice = [
    { key: '#', label: '#', value: (x) => x.seq },
    { key: 'nomor', label: 'Invoice', render: (x) => <strong>{x.nomor}</strong> },
    { key: 'jumlah', label: 'Jumlah', className: 'num', render: (x) => rupiah(x.jumlah) },
    { key: 'jenis', label: 'Jenis', render: (x) => <Badge tone="purple">{x.jenis}</Badge> },
    { key: 'tanggal', label: 'Tanggal', render: (x) => tanggal(x.tanggal) },
    {
      key: 'tenggat',
      label: 'Tenggat',
      render: (x) => (
        <>
          {tanggal(x.tenggat)}
          {invoiceTelat(x) && <small className="text-red block">⚠️ Terlambat</small>}
        </>
      ),
    },
    {
      key: 'tglBayar',
      label: 'Tgl. Bayar',
      render: (x) => (x.tglBayar ? <Badge tone="green">✓ {tanggal(x.tglBayar)}</Badge> : '-'),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      sortable: false,
      render: (x) => (
        <div className="aksi-btns">
          <Link className="btn btn-sm btn-gray" to={`/tagihan/${t.id}/invoice/${x.id}`}>🖨️ Cetak</Link>
          {x.tglBayar ? (
            <button className="btn btn-sm btn-ghost" onClick={() => batalBayar(x)}>↩ Batal bayar</button>
          ) : (
            <button className="btn btn-sm btn-blue" onClick={() => bayar(x)}>💳 Bayar</button>
          )}
          <button className="btn btn-sm btn-red" onClick={() => hapusInvoice(x)}>🗑️ Hapus</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tagihan 🧾</h1>
          <p>{t.nomor} · dibuat {tanggal(t.tanggal)}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={hapusTagihan}>🗑️ Hapus Tagihan</button>
          <Link className="btn btn-primary" to="/tagihan">← Kembali</Link>
        </div>
      </div>
      <ErrorBox error={error} />

      <div className="detail-grid">
        <InfoTagihan
          t={t}
          status={<Badge tone={toneStatus[r.status]}>{r.status}</Badge>}
          total={r.total}
          extra={
            <>
              <div><small>DIBAYAR</small><strong className="text-green">{rupiah(r.dibayar)}</strong></div>
              <div><small>SISA</small><strong>{rupiah(r.sisa)}</strong></div>
            </>
          }
          aksi={<button className="panel-btn" onClick={() => setOpenPenerima(true)}>✏️ Ubah</button>}
        />

        <div className="panel">
          <div className="panel-head">
            <h3>Detail Tagihan</h3>
            {!editItems && (
              <button className="panel-btn" onClick={() => setEditItems(r.items.map((it) => itemBaru(it)))}>✏️ Ubah item</button>
            )}
          </div>
          <div className="panel-body">
            {editItems ? (
              <>
                <ItemEditor items={editItems} onChange={setEditItems} />
                <div className="modal-foot">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditItems(null)}>Batal</button>
                  <button type="button" className="btn btn-primary" disabled={saving} onClick={simpanItems}>
                    {saving ? 'Menyimpan...' : 'Simpan 💾'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <DataTable columns={kolomItem} rows={r.items.map((it, i) => ({ ...it, _i: i + 1 }))} rowKey={(x) => x._i} empty="Belum ada item" />
                <div className="item-total"><span>Total</span><strong>{rupiah(totalItems(r.items))}</strong></div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>BHP (Barang Habis Pakai)</h3>
          {!editBhp && (
            <button className="btn btn-soft btn-sm" onClick={() => setEditBhp(bhp.map((it) => itemBaru(it)))}>✏️ Ubah BHP</button>
          )}
        </div>
        <p className="muted">Lampiran di halaman 2 invoice. Tidak menambah total tagihan.</p>
        {editBhp ? (
          <>
            <ItemEditor
              items={editBhp}
              onChange={setEditBhp}
              satuan
              labelNama="Nama Barang"
              placeholder="mis. Kabel UTP"
              labelTambah="Tambah Barang"
            />
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setEditBhp(null)}>Batal</button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={simpanBhp}>
                {saving ? 'Menyimpan...' : 'Simpan 💾'}
              </button>
            </div>
          </>
        ) : (
          <>
            <DataTable columns={kolomBhp} rows={bhp.map((it, i) => ({ ...it, _i: i + 1 }))} rowKey={(x) => x._i} empty="Belum ada BHP 📦" />
            {bhp.length > 0 && <div className="item-total"><span>Total BHP</span><strong>{rupiah(totalItems(bhp))}</strong></div>}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Invoice</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setOpenInvoice(true)}>+ Buat Invoice</button>
        </div>
        <DataTable columns={kolomInvoice} rows={r.invoices} empty="Belum ada invoice. Klik “Buat Invoice” untuk menagih (mis. DP) 💌" />
      </div>

      <Modal open={openPenerima} title="Ubah Penerima 👤" onClose={() => setOpenPenerima(false)} wide>
        {openPenerima && (
          <FormPenerima
            awal={t}
            labelSimpan="Simpan 💾"
            onBatal={() => setOpenPenerima(false)}
            onSimpan={async (p) => { await updateItem('tagihan', t.id, p); setOpenPenerima(false); }}
          />
        )}
      </Modal>

      <Modal open={openInvoice} title="Buat Invoice 🧾" onClose={() => setOpenInvoice(false)} wide>
        {openInvoice && <FormInvoice sisa={r.belumDitagih} onBatal={() => setOpenInvoice(false)} onSimpan={buatInvoice} />}
      </Modal>
    </>
  );
}
