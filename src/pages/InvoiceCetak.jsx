import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItem } from '../services/db';
import Loader from '../components/Loader';
import Gambar from '../components/Gambar';
import AksiDokumen from '../components/AksiDokumen';
import { num, rupiah, tanggal } from '../utils/format';
import { bhpTagihan, namaPenerima, ringkas, subtotal, totalItems } from '../utils/tagihan';
import { PERUSAHAAN } from '../utils/perusahaan';

// "2026-07-23" -> "23-07-2026"
const tglStrip = (d) => (d ? d.split('-').reverse().join('-') : '-');


export default function InvoiceCetak() {
  const { id, invId } = useParams();
  const [t, setT] = useState(null);
  const [status, setStatus] = useState('loading');
  const [denganBhp, setDenganBhp] = useState(false);
  const dokRef = useRef(null);

  useEffect(() => {
    getItem('tagihan', id)
      .then((x) => {
        setT(x);
        setStatus(x ? 'ok' : 'notfound');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') return <Loader full teks="Menyiapkan invoice..." />;
  const r = t && ringkas(t);
  const inv = r?.invoices.find((i) => i.id === invId);
  if (!inv) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-emoji">😿</span>
          <h1>Invoice tidak ditemukan</h1>
          <Link className="btn btn-primary" to={`/tagihan/${id}`}>Kembali</Link>
        </div>
      </div>
    );
  }

  // Sudah dibayar -> "Receipt", belum -> "Invoice"
  const lunas = Boolean(inv.tglBayar);
  const tglDokumen = lunas ? inv.tglBayar : inv.tanggal;
  // Rincian pembayaran: invoice ini & semua invoice sebelumnya
  const riwayat = [...r.invoices].filter((i) => num(i.seq) <= num(inv.seq)).sort((a, b) => num(a.seq) - num(b.seq));
  const sisa = Math.max(r.total - riwayat.reduce((a, i) => a + num(i.jumlah), 0), 0);
  const telahDibayar = riwayat.filter((i) => i.tglBayar).reduce((a, i) => a + num(i.jumlah), 0);
  // Cap: "LUNAS" kalau seluruh tagihan sudah terbayar, "DIBAYAR" kalau baru invoice ini saja
  const cap = !lunas ? null : r.total > 0 && telahDibayar >= r.total ? 'LUNAS' : 'DIBAYAR';

  const bhp = bhpTagihan(t);
  const tampilBhp = denganBhp && bhp.length > 0;

  const penerimaBaris = [t.alamat, t.kecamatan, t.kota, t.provinsi, t.negara].filter(Boolean);

  return (
    <div className="print-page">
      <AksiDokumen
        kembali={`/tagihan/${id}`}
        dokRef={dokRef}
        namaFile={`${lunas ? 'Receipt' : 'Invoice'} ${inv.nomor} - ${namaPenerima(t)}`}
      >
        {bhp.length > 0 && (
          <label className="cek-lampiran">
            <input type="checkbox" checked={denganBhp} onChange={(e) => setDenganBhp(e.target.checked)} />
            Sertakan lampiran BHP (hal. 2)
          </label>
        )}
      </AksiDokumen>

      <article className="doc" ref={dokRef}>
        <header className="doc-head">
          <Gambar src={PERUSAHAAN.logo} alt={PERUSAHAAN.nama} className="doc-logo" fallback={<h2 className="doc-logo-text">{PERUSAHAAN.nama}</h2>} />
          <div className="doc-title">
            <h1>{lunas ? 'Receipt' : 'Invoice'}&nbsp; {inv.jenis}</h1>
            <dl>
              <dt>Referensi</dt><dd>{inv.nomor}</dd>
              <dt>Tanggal</dt><dd>{tglStrip(tglDokumen)}</dd>
              {!lunas && <><dt>Jatuh tempo</dt><dd>{tglStrip(inv.tenggat)}</dd></>}
            </dl>
          </div>
        </header>

        <section className="doc-parties">
          <div>
            <h4>Dari</h4>
            <p className="doc-name">{PERUSAHAAN.nama}</p>
            {PERUSAHAAN.alamat.map((b) => <p key={b}>{b}</p>)}
            <p>Telp: {PERUSAHAAN.telp || '-'}</p>
            <p>Email: {PERUSAHAAN.email || '-'}</p>
          </div>
          <div>
            <h4>{lunas ? 'Diterima oleh' : 'Ditagihkan kepada'}</h4>
            <p className="doc-name">{namaPenerima(t)}</p>
            {penerimaBaris.map((b, i) => <p key={i}>{b}</p>)}
            <p>Telp: {t.telepon || '-'}</p>
            <p>Email: {t.email || '-'}</p>
          </div>
        </section>

        <p className="doc-caption">Rincian Biaya</p>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th className="c" style={{ width: '10%' }}>Qty</th>
              <th className="c" style={{ width: '20%' }}>Harga</th>
              <th className="c" style={{ width: '20%' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((it, i) => (
              <tr key={i}>
                <td>{it.nama}</td>
                <td className="c">{it.qty}</td>
                <td className="r">{rupiah(it.harga)}</td>
                <td className="r">{rupiah(subtotal(it))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="doc-total"><span>Total</span><span>{rupiah(r.total)}</span></div>

        <p className="doc-caption">Rincian Pembayaran</p>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Detail</th>
              <th style={{ width: '25%' }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((i) => (
              <tr key={i.id}>
                <td>{i.jenis}{i.id === inv.id ? '' : ` (${i.nomor})`}{!i.tglBayar ? ' — belum dibayar' : ''}</td>
                <td>{rupiah(i.jumlah)}</td>
              </tr>
            ))}
            <tr>
              <td>Total yang masih harus dibayar</td>
              <td>{rupiah(sisa)}</td>
            </tr>
          </tbody>
        </table>

        {cap && (
          <div className={`doc-cap ${cap === 'LUNAS' ? 'doc-cap-lunas' : ''}`} aria-label={cap}>
            <strong>{cap}</strong>
            <small>{tglStrip(inv.tglBayar)}</small>
          </div>
        )}

        <p className="doc-paid">
          {lunas ? `Jumlah yang telah dibayar ${rupiah(telahDibayar)}` : `Jumlah yang harus dibayar ${rupiah(inv.jumlah)}`}
        </p>

        <footer className="doc-sign">
          <p>{tanggal(tglDokumen)}</p>
          <p className="b">{PERUSAHAAN.nama}</p>
          <div className="doc-ttd">
            <Gambar src={PERUSAHAAN.stempel} alt="" className="doc-stempel" />
            <Gambar src={PERUSAHAAN.ttd} alt="Tanda tangan" className="doc-ttd-img" />
          </div>
          <p className="b">{PERUSAHAAN.penandatangan}</p>
          <p className="b">{PERUSAHAAN.jabatan}</p>
        </footer>

        {tampilBhp && (
          <section className="doc-lampiran">
            <div className="html2pdf__page-break" />
            <header className="doc-lampiran-head">
              <h2>Lampiran — Rincian Barang Habis Pakai</h2>
              <p>
                {inv.nomor} · {namaPenerima(t)}
              </p>
            </header>
            <table className="doc-table">
              <thead>
                <tr>
                  <th className="c" style={{ width: '6%' }}>No</th>
                  <th>Nama Barang</th>
                  <th className="c" style={{ width: '9%' }}>Qty</th>
                  <th className="c" style={{ width: '12%' }}>Satuan</th>
                  <th className="c" style={{ width: '18%' }}>Harga</th>
                  <th className="c" style={{ width: '18%' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {bhp.map((it, i) => (
                  <tr key={i}>
                    <td className="c">{i + 1}</td>
                    <td>{it.nama}</td>
                    <td className="c">{it.qty}</td>
                    <td className="c">{it.satuan || '-'}</td>
                    <td className="r">{rupiah(it.harga)}</td>
                    <td className="r">{rupiah(subtotal(it))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="doc-total"><span>Total BHP</span><span>{rupiah(totalItems(bhp))}</span></div>
          </section>
        )}
      </article>
    </div>
  );
}
