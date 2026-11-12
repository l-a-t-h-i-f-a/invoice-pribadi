import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCollection } from '../hooks/useCollection';
import { addItem } from '../services/db';
import InfoTagihan from '../components/InfoTagihan';
import ItemEditor, { bersihkanItemTagihan, itemBaru } from '../components/ItemEditor';
import Modal from '../components/Modal';
import FormPenerima from '../components/FormPenerima';
import { Badge } from '../components/ui';
import { hariIni } from '../utils/format';
import { totalItems } from '../utils/tagihan';

// Halaman draft: data penerima & item BELUM tersimpan sampai tombol "Simpan Tagihan" diklik
export default function TagihanBaru() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const semua = useCollection('tagihan');
  const [penerima, setPenerima] = useState(state?.penerima);
  const [items, setItems] = useState(() => [itemBaru()]);
  const [ubahPenerima, setUbahPenerima] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!penerima) return <Navigate to="/tagihan" replace />;

  const batal = () => {
    if (window.confirm('Batalkan tagihan ini? Data yang sudah diisi tidak akan disimpan.')) navigate('/tagihan');
  };

  const simpan = async () => {
    const bersih = bersihkanItemTagihan(items);
    if (!bersih.length || totalItems(bersih) <= 0) {
      alert('Tambahkan minimal satu item dengan harga dulu ya 🎀');
      return;
    }
    setSaving(true);
    try {
      const ym = hariIni().slice(0, 7).replace('-', '');
      const ref = await addItem('tagihan', {
        ...penerima,
        nomor: `TGH-${ym}-${String(semua.data.length + 1).padStart(3, '0')}`,
        tanggal: hariIni(),
        items: bersih,
        invoices: [],
      });
      navigate(`/tagihan/${ref.id}`, { replace: true });
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tagihan Baru 📝</h1>
          <p>Tambahkan item tagihan, lalu klik Simpan Tagihan</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-ghost" to="/tagihan" onClick={(e) => { e.preventDefault(); batal(); }}>← Kembali</Link>
        </div>
      </div>

      <div className="notice">🌷 Draft ini <strong>belum tersimpan</strong>. Data baru masuk database setelah kamu klik <strong>Simpan Tagihan</strong>.</div>

      <div className="detail-grid">
        <InfoTagihan
          t={penerima}
          status={<Badge tone="gray">📝 Draft (belum disimpan)</Badge>}
          total={totalItems(items)}
          aksi={<button className="panel-btn" onClick={() => setUbahPenerima(true)}>✏️ Ubah</button>}
        />

        <div className="panel">
          <div className="panel-head"><h3>Detail Tagihan</h3></div>
          <div className="panel-body">
            <ItemEditor items={items} onChange={setItems} />
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={batal}>Batal</button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={simpan}>
                {saving ? 'Menyimpan...' : 'Simpan Tagihan 💾'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={ubahPenerima} title="Ubah Penerima 👤" onClose={() => setUbahPenerima(false)} wide>
        {ubahPenerima && (
          <FormPenerima
            awal={penerima}
            labelSimpan="Simpan"
            onBatal={() => setUbahPenerima(false)}
            onSimpan={async (p) => { setPenerima(p); setUbahPenerima(false); }}
          />
        )}
      </Modal>
    </>
  );
}
