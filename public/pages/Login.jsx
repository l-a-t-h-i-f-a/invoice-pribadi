import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/ui';

const pesanError = {
  'auth/invalid-credential': 'Email atau kata sandi salah.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti.',
  'auth/operation-not-allowed': 'Aktifkan login Email/Password di Firebase Console.',
};

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, pass);
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
        <h1>SlipGaji</h1>
        <p className="auth-sub">Halo lagi! Silakan masuk dulu ya ✨</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@perusahaan.com" />
          </label>
          <label className="field">
            <span className="field-label">Kata sandi</span>
            <PasswordInput required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Sebentar...' : 'Masuk'}
          </button>
        </form>
        <p className="auth-switch">
          Belum punya akun? <Link className="link" to="/daftar">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
