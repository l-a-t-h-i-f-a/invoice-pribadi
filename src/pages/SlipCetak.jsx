import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItem } from '../services/db';
import Loader from '../components/Loader';
import Gambar from '../components/Gambar';
import AksiDokumen from '../components/AksiDokumen';
import { namaBulan, num } from '../utils/format';
import { rincian } from '../utils/slip';
import { PERUSAHAAN } from '../utils/perusahaan';

const angka = (n) => num(n).toLocaleString('id-ID');

function Daftar({ items }) {
  return (
    <div className="slipdoc-list">
      {items.map((it, i) => (
        <div key={i}>
          <span>{it.keterangan}</span>
          <span>{angka(it.nominal)}</span>
        </div>
      ))}
    </div>
  );
}

export default function SlipCetak() {
  const { id } = useParams();
  const [slip, setSlip] = useState(null);
  const [status, setStatus] = useState('loading');
  const dokRef = useRef(null);

  useEffect(() => {
    getItem('slipGaji', id)
      .then((s) => {
        setSlip(s);
        setStatus(s ? 'ok' : 'notfound');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') return <Loader full teks="Menyiapkan slip..." />;
  if (status !== 'ok')
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-emoji">😿</span>
          <h1>Slip tidak ditemukan</h1>
          <Link className="btn btn-primary" to="/slip-gaji">Kembali</Link>
        </div>
      </div>
    );

  const r = rincian(slip);
  const pendapatan = [{ keterangan: 'Gaji Pokok', nominal: slip.gajiPokok }, ...r.pendapatan];
  const dept = [slip.departemen, slip.jabatan].filter(Boolean).join(' / ') || '-';

  return (
    <div className="print-page">
      <AksiDokumen
        kembali="/slip-gaji"
        dokRef={dokRef}
        namaFile={`Slip Gaji - ${slip.nama} - ${namaBulan(slip.periode)}`}
      />

      <article className="doc slipdoc" ref={dokRef}>
        <Gambar src={PERUSAHAAN.logoIcon} alt="" className="slipdoc-watermark" />

        <header className="doc-head">
          <Gambar
            src={PERUSAHAAN.logo}
            alt={PERUSAHAAN.nama}
            className="doc-logo"
            fallback={<h2 className="doc-logo-text">{PERUSAHAAN.nama}</h2>}
          />
          <h1 className="slipdoc-title">Slip Gaji</h1>
        </header>

        <section className="slipdoc-info">
          <div className="slipdoc-company">
            <strong>{PERUSAHAAN.nama}</strong>
            {PERUSAHAAN.alamat.map((b) => <p key={b}>{b}</p>)}
          </div>
          <dl>
            <dt>Nama</dt><dd>{slip.nama}</dd>
            <dt>Dept / Jabatan</dt><dd>{dept}</dd>
            <dt>Periode Gaji</dt><dd>{namaBulan(slip.periode)}</dd>
          </dl>
        </section>

        <section className="slipdoc-cols">
          <div className="slipdoc-bar">Pendapatan</div>
          <div className="slipdoc-bar">Potongan</div>
          <Daftar items={pendapatan} />
          <Daftar items={r.potongan} />
          <div className="slipdoc-sum"><span>Total Pendapatan</span><span>{angka(slip.totalPendapatan)}</span></div>
          <div className="slipdoc-sum"><span>Total Potongan</span><span>{angka(slip.totalPotongan)}</span></div>
        </section>

        <div className="slipdoc-bar slipdoc-net">
          <span>Gaji Bersih (Take Home Pay)</span>
          <span>{angka(slip.gajiBersih)}</span>
        </div>

        {num(slip.ditunda) > 0 && (
          <section className="slipdoc-tunda">
            <div><span>Gaji ditunda (piutang perusahaan)</span><span>{angka(slip.ditunda)}</span></div>
            <div><span>Dibayarkan bulan ini</span><span>{angka(num(slip.gajiBersih) - num(slip.ditunda))}</span></div>
          </section>
        )}

        <div className="slipdoc-bar">Keterangan</div>
        <p className="slipdoc-note">{slip.catatan || '-'}</p>
      </article>
    </div>
  );
}
