export default function Loader({ full, teks = 'Memuat data...' }) {
  return (
    <div className={full ? 'loader loader-full' : 'loader'}>
      <span className="loader-flower">🌸</span>
      <p>{teks}</p>
    </div>
  );
}
