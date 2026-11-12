import { useState } from 'react';
import { Field, IconInput } from './ui';
import { namaPenerima } from '../utils/tagihan';

export const penerimaKosong = {
  nama: '', telepon: '', email: '', alamat: '', kecamatan: '', kota: '', provinsi: '', negara: 'Indonesia',
};

export default function FormPenerima({ awal = {}, labelSimpan, onBatal, onSimpan }) {
  const namaAwal = namaPenerima(awal);
  const [f, setF] = useState({ ...penerimaKosong, ...awal, nama: namaAwal === '-' ? '' : namaAwal });
  const [saving, setSaving] = useState(false);
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = Object.fromEntries(Object.keys(penerimaKosong).map((k) => [k, String(f[k] || '').trim()]));
    try {
      await onSimpan(data);
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="penerima-grid">
        <div className="penerima-col">
          <Field label="Nama Penerima *">
            <IconInput icon="👤" name="nama" required placeholder="Masukkan nama" value={f.nama} onChange={set} />
          </Field>
          <Field label="Nomor Telepon">
            <IconInput icon="📞" name="telepon" type="tel" placeholder="Masukkan nomor telepon" value={f.telepon} onChange={set} />
          </Field>
          <Field label="Email">
            <IconInput icon="✉️" name="email" type="email" placeholder="Masukkan email" value={f.email} onChange={set} />
          </Field>
        </div>
        <div className="penerima-col">
          <Field label="Alamat Penerima">
            <IconInput icon="📍" name="alamat" placeholder="Masukkan alamat" value={f.alamat} onChange={set} />
          </Field>
          <Field label="Kecamatan">
            <IconInput icon="🪧" name="kecamatan" placeholder="Masukkan kecamatan" value={f.kecamatan} onChange={set} />
          </Field>
          <Field label="Kota *">
            <IconInput icon="🏙️" name="kota" required placeholder="Masukkan kota" value={f.kota} onChange={set} />
          </Field>
          <Field label="Provinsi *">
            <IconInput icon="🗺️" name="provinsi" required placeholder="Masukkan provinsi" value={f.provinsi} onChange={set} />
          </Field>
          <Field label="Negara *">
            <IconInput icon="🏳️" name="negara" required placeholder="Masukkan negara" value={f.negara} onChange={set} />
          </Field>
        </div>
      </div>
      <p className="form-note">* input harus diisi</p>
      <div className="modal-foot spread">
        <button type="button" className="btn btn-ghost" onClick={onBatal}>Batal</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : labelSimpan}</button>
      </div>
    </form>
  );
}
