import { rupiah } from '../utils/format';
import { namaPenerima } from '../utils/tagihan';

const Baris = ({ label, value }) => (
  <div className="info-row">
    <span>{label}</span>
    <span>{value || '-'}</span>
  </div>
);

// Kartu "Info Tagihan": status, total, data penerima & alamat
export default function InfoTagihan({ t, status, total, extra, aksi }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Info Tagihan</h3>
        {aksi}
      </div>
      <div className="panel-body">
        <div className="info-top">
          <div>
            <small>STATUS</small>
            <div>{status}</div>
          </div>
          <div>
            <small>TOTAL</small>
            <strong className="info-total">{rupiah(total)}</strong>
          </div>
          {extra}
        </div>

        <h4 className="info-section">Penerima</h4>
        <Baris label="Nama" value={namaPenerima(t)} />
        <Baris label="Nomor" value={t.telepon} />
        <Baris label="Email" value={t.email} />

        <h4 className="info-section">Alamat</h4>
        <Baris label="Alamat" value={t.alamat} />
        <Baris label="Kecamatan" value={t.kecamatan} />
        <Baris label="Kota" value={t.kota} />
        <Baris label="Provinsi" value={t.provinsi} />
        <Baris label="Negara" value={t.negara} />
      </div>
    </div>
  );
}
