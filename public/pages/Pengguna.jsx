import { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { authTambahUser, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Empty, ErrorBox, Field, PageHeader, PasswordInput } from '../components/ui';
import { tanggal } from '../utils/format';

const pesanError = {
  'auth/email-already-in-use': 'Email ini sudah punya akun.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Kata sandi minimal 6 karakter.',
  'auth/operation-not-allowed':
    'Pembuatan akun dimatikan di Firebase Console. Nyalakan lagi "Enable create (sign-up)" di Authentication → Settings → User actions.',
  'auth/admin-restricted-operation':
    'Pembuatan akun dimatikan di Firebase Console. Nyalakan lagi "Enable create (sign-up)" di Authentication → Settings → User actions.',
};

const kosong = { email: '', pass: '' };

export default function Pengguna() {
  const { user } = useAuth();
  const pengguna = useCollection('pengguna');
  const [buka, setBuka] = useState(false);
  const [form, setForm] = useState(kosong);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const tutup = () => {
    setBuka(false);
    setForm(kosong);
    setError('');
  };

  const simpan = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(authTambahUser, form.email.trim(), form.pass);
      await signOut(authTambahUser);
      await setDoc(doc(db, 'pengguna', cred.user.uid), {
        email: cred.user.email,
        dibuatOleh: user?.email || '',
        createdAt: serverTimestamp(),
      });
      tutup();
    } catch (err) {
      setError(pesanError[err.code] || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Pengguna 🔑" subtitle="Akun yang bisa masuk ke aplikasi">
        <button className="btn btn-primary" onClick={() => setBuka(true)}>+ Tambah Pengguna</button>
      </PageHeader>

      <div className="card">
        <ErrorBox error={pengguna.error} />
        {pengguna.loading ? (
          <Loader />
        ) : pengguna.data.length === 0 ? (
          <Empty icon="🔑" teks="Belum ada pengguna tercatat." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Ditambahkan oleh</th>
                  <th>Tanggal</th>
                  <th>Terakhir masuk</th>
                </tr>
              </thead>
              <tbody>
                {pengguna.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="person">
                        <span className="avatar">{p.email?.[0]?.toUpperCase()}</span>
                        <strong>{p.email}</strong>
                      </div>
                    </td>
                    <td>{p.dibuatOleh || '-'}</td>
                    <td>{p.createdAt?.toDate ? tanggal(p.createdAt.toDate()) : '-'}</td>
                    <td>{p.terakhirMasuk?.toDate ? tanggal(p.terakhirMasuk.toDate()) : 'Belum pernah'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={buka} title="Tambah Pengguna 🔑" onClose={tutup}>
        <form onSubmit={simpan}>
          <div className="form-grid">
            <Field label="Email">
              <input name="email" type="email" required value={form.email} onChange={set} placeholder="nama@perusahaan.com" />
            </Field>
            <Field label="Kata sandi" hint="Minimal 6 karakter">
              <PasswordInput name="pass" required minLength={6} value={form.pass} onChange={set} />
            </Field>
          </div>
          {error && <div className="alert">{error}</div>}
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={tutup}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan 💾'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
