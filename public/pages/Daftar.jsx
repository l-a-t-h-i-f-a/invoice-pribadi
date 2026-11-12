import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/ui';

const pesanError = {
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Kata sandi minimal 6 karakter.',
  'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti.',
  'auth/operation-not-allowed': 'Aktifkan login Email/Password di Firebase Console.',
  'auth/admin-restricted-operation': 'Pendaftaran dimatikan di Firebase Console (Authentication → Settings → User actions).',
};

export default function Daftar() {
  const { user, register } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [ulang, setUlang] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pass !== ulang) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setBusy(true);
    try {
      // Setelah berhasil, Firebase otomatis login dan AuthContext mencatat akun ke koleksi `pengguna`
      await register(email.trim(), pass);
    } catch (err) {
      setError(pesanError[err.code] || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img className="auth-logo" src="/brand-icon.png" alt="Enuma Technology" />
        <h1>Daftar Akun</h1>
        <p className="auth-sub">Buat akun baru untuk masuk ke SlipGaji ✨</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@perusahaan.com" />
          </label>
          <label className="field">
            <span className="field-label">Kata sandi</span>
            <PasswordInput required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Minimal 6 karakter" />
          </label>
          <label className="field">
            <span className="field-label">Ulangi kata sandi</span>
            <PasswordInput required minLength={6} value={ulang} onChange={(e) => setUlang(e.target.value)} placeholder="••••••" />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Sebentar...' : 'Daftar'}
          </button>
        </form>
        <p className="auth-switch">
          Sudah punya akun? <Link className="link" to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
