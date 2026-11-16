// Ubah elemen dokumen jadi file PDF A4 dan langsung unduh (tanpa dialog print)
const MARGIN = 10; // mm
const A4 = { w: 210, h: 297 }; // mm

export async function unduhPdf(el, namaFile) {
  const { default: html2pdf } = await import('html2pdf.js');
  const filename = `${namaFile.replace(/[\\/:*?"<>|]+/g, '-')}.pdf`;
  // Ada penanda pindah halaman (mis. lampiran) -> boleh beberapa halaman.
  // Tidak ada -> dipaskan jadi 1 halaman supaya tidak muncul halaman kosong.
  const banyakHalaman = Boolean(el.querySelector('.html2pdf__page-break'));
  const opt = {
    margin: [MARGIN, MARGIN, MARGIN, MARGIN],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    // windowWidth lebar supaya tata letak tetap versi desktop walau dibuka di HP
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1100 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  el.classList.add('pdf-mode');
  try {
    if (banyakHalaman) {
      await html2pdf().set(opt).from(el).save();
      return;
    }
    const canvas = await html2pdf().set(opt).from(el).toCanvas().get('canvas');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF(opt.jsPDF);
    const maxW = A4.w - MARGIN * 2;
    const maxH = A4.h - MARGIN * 2;
    let w = maxW;
    let h = (canvas.height * w) / canvas.width;
    if (h > maxH) {
      // Sedikit lebih panjang dari 1 halaman -> perkecil sampai muat
      h = maxH;
      w = (canvas.width * h) / canvas.height;
    }
    const x = MARGIN + (maxW - w) / 2;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', x, MARGIN, w, h);
    pdf.save(filename);
  } finally {
    el.classList.remove('pdf-mode');
  }
}
