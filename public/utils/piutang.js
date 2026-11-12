import { num } from './format';

// Gaji ditunda tidak boleh negatif atau melebihi gaji bersih
export const batasDitunda = (ditunda, gajiBersih) => Math.min(Math.max(num(ditunda), 0), Math.max(num(gajiBersih), 0));

// Ringkasan piutang satu karyawan dari slip yang ditunda & pelunasannya
export function ringkasPiutang(karyawanId, slip, pelunasan) {
  const slipDitunda = slip.filter((s) => s.karyawanId === karyawanId && num(s.ditunda) > 0);
  const bayar = pelunasan.filter((p) => p.karyawanId === karyawanId);
  const ditunda = slipDitunda.reduce((a, s) => a + num(s.ditunda), 0);
  const dilunasi = bayar.reduce((a, p) => a + num(p.nominal), 0);
  return { slipDitunda, bayar, ditunda, dilunasi, sisa: Math.max(ditunda - dilunasi, 0) };
}
