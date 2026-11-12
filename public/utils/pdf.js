// Ubah elemen dokumen jadi file PDF A4 dan langsung unduh (tanpa dialog print)
export async function unduhPdf(el, namaFile) {
  const { default: html2pdf } = await import('html2pdf.js');
  const filename = `${namaFile.replace(/[\\/:*?"<>|]+/g, '-')}.pdf`;
  el.classList.add('pdf-mode');
  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        // windowWidth lebar supaya tata letak tetap versi desktop walau dibuka di HP
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1100 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(el)
      .save();
  } finally {
    el.classList.remove('pdf-mode');
  }
}
