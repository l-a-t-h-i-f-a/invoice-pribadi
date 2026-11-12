import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCollection } from '../hooks/useCollection';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { Badge, Empty, ErrorBox, PageHeader, StatCard } from '../components/ui';
import { bulanIni, inisial, namaBulan, num, periodeTerakhir, rupiah, rupiahSingkat, tanggal } from '../utils/format';
import { invoicesTagihan, invoiceTelat, namaPenerima, ringkas, STATUS } from '../utils/tagihan';

function GrafikGaji({ data }) {
  const max = Math.max(...data.map((d) => d.nilai), 1);
  return (
    <div className="bar-chart" role="img" aria-label="Total gaji bersih per bulan, 6 bulan terakhir">
      {data.map((d) => (
        <div className="bar-col" key={d.periode} tabIndex={0}>
          <div className="bar-track">
            <div className="bar-tip">
              <strong>{namaBulan(d.periode)}</strong>
              <span>{rupiah(d.nilai)}</span>
              <span>{d.jumlah} slip</span>
            </div>
            <div className="bar" style={{ height: `${(d.nilai / max) * 100}%` }} />
          </div>
          <span className="bar-label">{namaBulan(d.periode, true)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const karyawan = useCollection('karyawan');
  const slip = useCollection('slipGaji');
  const tagihan = useCollection('tagihan');

  const s = useMemo(() => {
    const ini = bulanIni();
    const slipIni = slip.data.filter((x) => x.periode === ini);
    const belum = tagihan.data.map(ringkas).filter((r) => r.status !== STATUS.lunas);
    const invoiceBelum = tagihan.data
      .flatMap((t) => invoicesTagihan(t).map((inv) => ({ ...inv, t })))
      .filter((inv) => !inv.tglBayar);
    const grafik = periodeTerakhir(6).map((p) => {
      const rows = slip.data.filter((x) => x.periode === p);
      return { periode: p, nilai: rows.reduce((a, x) => a + num(x.gajiBersih), 0), jumlah: rows.length };
    });

    const perDept = {};
    karyawan.data
      .filter((k) => k.status !== 'Nonaktif')
      .forEach((k) => {
        const d = k.departemen || 'Lainnya';
        perDept[d] = (perDept[d] || 0) + 1;
      });

    return {
      aktif: karyawan.data.filter((k) => k.status !== 'Nonaktif').length,
      gajiIni: slipIni.reduce((a, x) => a + num(x.gajiBersih), 0),
      slipIni: slipIni.length,
      dibayarIni: slipIni.filter((x) => x.status === 'Dibayar').length,
      belumTotal: belum.reduce((a, r) => a + r.sisa, 0),
      nBelum: belum.length,
      nTelat: invoiceBelum.filter(invoiceTelat).length,
      grafik,
      dept: Object.entries(perDept).sort((a, b) => b[1] - a[1]),
      jatuhTempo: [...invoiceBelum].sort((a, b) => String(a.tenggat).localeCompare(String(b.tenggat))).slice(0, 5),
      slipBaru: slip.data.slice(0, 5),
    };
  }, [karyawan.data, slip.data, tagihan.data]);

  const loading = karyawan.loading || slip.loading || tagihan.loading;
  const nama = user?.email?.split('@')[0];
  const maxDept = Math.max(...s.dept.map((d) => d[1]), 1);

  return (
    <>
      <PageHeader title={`Halo, ${nama}! 🌷`} subtitle={`Ringkasan per ${tanggal(new Date())}`} />
      <ErrorBox error={karyawan.error || slip.error || tagihan.error} />

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="stats">
            <StatCard icon="👩‍💼" label="Karyawan aktif" value={s.aktif} sub={`${karyawan.data.length} total terdaftar`} />
            <StatCard icon="💸" tone="purple" label={`Gaji ${namaBulan(bulanIni())}`} value={rupiahSingkat(s.gajiIni)} sub={`${s.slipIni} slip dibuat`} />
            <StatCard icon="💌" tone="green" label="Slip sudah dibayar" value={`${s.dibayarIni}/${s.slipIni}`} sub="bulan ini" />
            <StatCard icon="🧾" tone={s.nTelat ? 'red' : 'yellow'} label="Tagihan belum lunas" value={rupiahSingkat(s.belumTotal)} sub={`${s.nBelum} tagihan${s.nTelat ? ` · ${s.nTelat} terlambat` : ''}`} />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>Total gaji bersih 📈</h3>
                <small className="muted">6 bulan terakhir</small>
              </div>
              <GrafikGaji data={s.grafik} />
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Karyawan per departemen 🏢</h3>
              </div>
              {s.dept.length === 0 ? (
                <Empty teks="Belum ada data karyawan." />
              ) : (
                <div className="hbars">
                  {s.dept.map(([d, n]) => (
                    <div className="hbar-row" key={d}>
                      <span className="hbar-label">{d}</span>
                      <div className="hbar-track">
                        <div className="hbar" style={{ width: `${(n / maxDept) * 100}%` }} />
                      </div>
                      <span className="hbar-val">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>Invoice jatuh tempo ⏰</h3>
                <Link to="/tagihan" className="link">Lihat semua →</Link>
              </div>
              {s.jatuhTempo.length === 0 ? (
                <Empty icon="🎉" teks="Tidak ada invoice yang belum dibayar!" />
              ) : (
                <ul className="mini-list">
                  {s.jatuhTempo.map((inv) => (
                    <li key={inv.id}>
                      <Link to={`/tagihan/${inv.t.id}`}>
                        <strong>{namaPenerima(inv.t)}</strong>
                        <small>{inv.nomor} · tenggat {tanggal(inv.tenggat)}</small>
                      </Link>
                      <div className="right">
                        <strong>{rupiah(inv.jumlah)}</strong>
                        {invoiceTelat(inv) ? <Badge tone="red">Terlambat</Badge> : <Badge tone="yellow">Belum dibayar</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Slip gaji terbaru 💌</h3>
                <Link to="/slip-gaji" className="link">Lihat semua →</Link>
              </div>
              {s.slipBaru.length === 0 ? (
                <Empty icon="💌" teks="Belum ada slip gaji." />
              ) : (
                <ul className="mini-list">
                  {s.slipBaru.map((x) => (
                    <li key={x.id}>
                      <div className="person">
                        <span className="avatar sm">{inisial(x.nama)}</span>
                        <div>
                          <strong>{x.nama}</strong>
                          <small>{namaBulan(x.periode)}</small>
                        </div>
                      </div>
                      <div className="right">
                        <strong>{rupiah(x.gajiBersih)}</strong>
                        <Badge tone={x.status === 'Dibayar' ? 'green' : 'yellow'}>{x.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
