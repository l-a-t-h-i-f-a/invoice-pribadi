import { useState } from 'react';

export function Field({ label, hint, full, children }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export function IconInput({ icon, ...props }) {
  return (
    <div className="input-group">
      <span aria-hidden="true">{icon}</span>
      <input {...props} />
    </div>
  );
}

export function StatCard({ icon, label, value, sub, tone = 'primary' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-text">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

export function Empty({ icon = '🎀', teks }) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <p>{teks}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

export function Badge({ tone = 'primary', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="alert">
      😿 Gagal memuat data: {error.message}
      {error.code === 'permission-denied' && ' — cek Firestore rules kamu ya.'}
    </div>
  );
}

export function PasswordInput(props) {
  const [lihat, setLihat] = useState(false);
  return (
    <div className="password-input">
      <input {...props} type={lihat ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setLihat(!lihat)}
        aria-label={lihat ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
        title={lihat ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
      >
        {lihat ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
