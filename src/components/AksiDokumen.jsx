import { useState } from 'react';
import { Link } from 'react-router-dom';
import { unduhPdf } from '../utils/pdf';

// Tombol di atas dokumen cetak: kembali & download PDF
export default function AksiDokumen({ kembali, dokRef, namaFile, children }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await unduhPdf(dokRef.current, namaFile);
    } catch (err) {
      alert(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="print-actions no-print">
      <Link className="btn btn-ghost" to={kembali}>← Kembali</Link>
      {children}
      <button className="btn btn-primary" onClick={download} disabled={busy}>
        {busy ? 'Menyiapkan PDF...' : '⬇️ Download PDF'}
      </button>
    </div>
  );
}
