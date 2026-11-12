import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isConfigured } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Daftar from './pages/Daftar';
import Dashboard from './pages/Dashboard';
import Karyawan from './pages/Karyawan';
import SlipGaji from './pages/SlipGaji';
import SlipCetak from './pages/SlipCetak';
import PiutangGaji from './pages/PiutangGaji';
import Tagihan from './pages/Tagihan';
import TagihanBaru from './pages/TagihanBaru';
import TagihanDetail from './pages/TagihanDetail';
import InvoiceCetak from './pages/InvoiceCetak';
import Pengguna from './pages/Pengguna';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function SetupNotice() {
  return (
    <div className="auth-page">
      <div className="auth-card setup">
        <span className="auth-emoji">🔧</span>
        <h1>Firebase belum dikonfigurasi</h1>
        <ol>
          <li>Salin <code>.env.example</code> menjadi <code>.env</code></li>
          <li>Isi nilai <code>VITE_FIREBASE_*</code> dari Firebase Console</li>
          <li>Jalankan ulang <code>npm run dev</code></li>
        </ol>
        <p>Langkah lengkapnya ada di <code>README.md</code> 💕</p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <SetupNotice />;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/daftar" element={<Daftar />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="karyawan" element={<Karyawan />} />
            <Route path="slip-gaji" element={<SlipGaji />} />
            <Route path="piutang-gaji" element={<PiutangGaji />} />
            <Route path="tagihan" element={<Tagihan />} />
            <Route path="tagihan/baru" element={<TagihanBaru />} />
            <Route path="tagihan/:id" element={<TagihanDetail />} />
            <Route path="pengguna" element={<Pengguna />} />
          </Route>
          <Route
            path="/slip-gaji/:id/cetak"
            element={
              <Protected>
                <SlipCetak />
              </Protected>
            }
          />
          <Route
            path="/tagihan/:id/invoice/:invId"
            element={
              <Protected>
                <InvoiceCetak />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
