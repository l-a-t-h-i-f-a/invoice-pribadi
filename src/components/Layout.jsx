import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menu = [
  { to: '/', label: 'Dashboard', icon: '🏡', end: true },
  { to: '/karyawan', label: 'Data Karyawan', icon: '👩‍💼' },
  { to: '/slip-gaji', label: 'Slip Gaji', icon: '💌' },
  { to: '/piutang-gaji', label: 'Piutang Gaji', icon: '🤝' },
  { to: '/tagihan', label: 'Data Tagihan', icon: '🧾' },
  { to: '/pengguna', label: 'Pengguna', icon: '🔑' },
];

const MOBILE = '(max-width: 800px)';

const bacaCollapsed = () => {
  try {
    return localStorage.getItem('sidebarCollapsed') === '1';
  } catch {
    return false;
  }
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false); // laci menu di layar HP
  const [collapsed, setCollapsed] = useState(bacaCollapsed); // sidebar disembunyikan di layar lebar

  const toggleMenu = () => {
    if (window.matchMedia(MOBILE).matches) {
      setOpen(true);
      return;
    }
    const baru = !collapsed;
    setCollapsed(baru);
    try {
      localStorage.setItem('sidebarCollapsed', baru ? '1' : '0');
    } catch {
      // abaikan kalau storage diblokir
    }
  };

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-logo"><img src="/brand-icon.png" alt="Enuma Technology" /></span>
          <div>
            <strong>Finance Enuma</strong>
            <small>payroll</small>
          </div>
        </div>
        <nav>
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end} onClick={() => setOpen(false)}>
              <span className="nav-icon">{m.icon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span>🐰</span>
          <p>Semangat kerja hari ini!</p>
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={toggleMenu} aria-label="Buka/tutup menu">☰</button>
          <div className="topbar-spacer" />
          <div className="user-chip">
            <span className="avatar sm">{user?.email?.[0]?.toUpperCase()}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Keluar</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
