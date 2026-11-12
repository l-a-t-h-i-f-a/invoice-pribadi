# 🌸 SlipGaji — Aplikasi Slip Gaji Kawaii

Aplikasi web slip gaji bertema biru, dibuat dengan **React + Vite** dan **Firebase** (Firestore + Authentication).

## ✨ Fitur

- **Dashboard** — ringkasan karyawan aktif, total gaji bulan ini, status pembayaran slip, tagihan belum lunas, grafik gaji 6 bulan terakhir, karyawan per departemen, tagihan terdekat, dan slip terbaru.
- **Data Karyawan** — tambah / ubah / hapus, pencarian, filter status, data gaji pokok & rekening bank.
- **Slip Gaji** — buat slip per karyawan (gaji pokok otomatis dari data karyawan, rincian pendapatan & potongan bisa ditambah sesuka hati), buat **massal** untuk semua karyawan aktif, filter per periode, tandai dibayar, dan **cetak / simpan PDF**.
- **Data Tagihan** — isi data penerima → halaman draft untuk menambah item (nama, harga, qty) → simpan. Di halaman detail, buat invoice bertahap (DP / Cicilan / Pelunasan) dengan nomor otomatis, tandai dibayar, dan cetak invoice. Status Belum Lunas / Sebagian / Lunas dihitung otomatis.
- Login admin dengan Firebase Authentication (email & kata sandi).
- Data **realtime** — perubahan langsung tampil tanpa refresh.

## 🚀 Cara Menjalankan

### 1. Siapkan project Firebase

1. Buka <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Sign-in method** → aktifkan **Email/Password**.
3. **Build → Firestore Database → Create database** (pilih lokasi, misalnya `asia-southeast2` Jakarta).
4. Tab **Rules** di Firestore → salin isi file [`firestore.rules`](firestore.rules) → **Publish**.
5. **Project settings (⚙️) → General → Your apps → Web (`</>`)** → daftarkan app, lalu salin `firebaseConfig`.

### 2. Isi konfigurasi

```bash
cp .env.example .env
```

Isi `.env` dengan nilai dari `firebaseConfig`, serta data perusahaan (nama, alamat, telepon, email, penandatangan) untuk slip gaji & invoice.

Gambar untuk slip gaji & invoice ada di folder `public/` (PNG transparan): **`logo.png`** (logo kop), **`logo-icon.png`** (watermark slip gaji), **`ttd.png`** (tanda tangan) dan **`stempel.png`** (cap). Ganti file-nya untuk mengganti gambar; kalau file tidak ada, dokumen tetap bisa dicetak tanpa gambar.

### 3. Jalankan

```bash
npm install
npm run dev
```

Buka <http://localhost:5173>, lalu buat akun lewat halaman **Daftar** (`/daftar`, ada tautannya di halaman login)
atau lewat Firebase Console (**Authentication → Users → Add user**).
Akun berikutnya juga bisa ditambahkan dari menu **Pengguna** di dalam aplikasi.

> ⚠️ Halaman Daftar terbuka untuk siapa saja yang tahu alamat aplikasinya, dan setiap akun yang login
> bisa membaca semua data (gaji, rekening, tagihan). Setelah akun-akun yang dibutuhkan sudah dibuat,
> matikan *Enable create (sign-up)* di Firebase Console (Authentication → Settings → User actions).

> ⚠️ Menu **Pengguna** butuh *Enable create (sign-up)* tetap menyala di Firebase Console
> (Authentication → Settings → User actions). Kalau dimatikan, akun hanya bisa dibuat dari Console.
> Jangan lupa deploy ulang `firestore.rules` (ada koleksi baru `pengguna`).

## 🌐 Deploy ke Firebase Hosting (opsional)

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pilih project kamu
npm run build
firebase deploy
```

## 🗂️ Struktur Data Firestore

| Koleksi     | Field utama |
|-------------|-------------|
| `karyawan`  | nip, nama, jabatan, departemen, email, telepon, gajiPokok, bank, noRekening, tanggalMasuk, status |
| `slipGaji`  | karyawanId, nama, jabatan, periode (`YYYY-MM`), gajiPokok, pendapatan[] & potongan[] (`{keterangan, nominal}`), totalPendapatan, totalPotongan, gajiBersih, status |
| `tagihan`   | nomor, nama, telepon, email, alamat, kecamatan, kota, provinsi, negara, tanggal, items[] (`{nama, harga, qty}`), invoices[] (`{id, seq, nomor, jenis, jumlah, tanggal, tenggat, tglBayar}`) |

Data karyawan disalin ke slip saat dibuat, sehingga slip lama tidak berubah walaupun data karyawan diubah kemudian.

## 📁 Struktur Folder

```
src/
├── components/   Layout, Modal, Loader, komponen UI kecil
├── context/      AuthContext (login Firebase)
├── hooks/        useCollection (data realtime Firestore)
├── pages/        Dashboard, Karyawan, SlipGaji, SlipCetak, Tagihan, Login
├── services/     helper CRUD Firestore
├── utils/        format rupiah, tanggal, periode
├── firebase.js   inisialisasi Firebase
└── index.css     tema biru 💙
```
# invoice-pribadi
