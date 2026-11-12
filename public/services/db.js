import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const addItem = (col, data) =>
  addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });

export const updateItem = (col, id, data) =>
  updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });

export const deleteItem = (col, id) => deleteDoc(doc(db, col, id));

export const getItem = async (col, id) => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Hapus banyak dokumen sekaligus (maks. 500 per batch Firestore)
export const deleteMany = async (col, ids) => {
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(db);
    ids.slice(i, i + 500).forEach((id) => batch.delete(doc(db, col, id)));
    await batch.commit();
  }
};

// Hapus karyawan beserta semua slip gaji & pelunasan piutangnya
export const deleteKaryawan = async (ids) => {
  // Query `in` Firestore maks. 30 nilai per query
  const idsMilik = async (col) => {
    const hasil = [];
    for (let i = 0; i < ids.length; i += 30) {
      const snap = await getDocs(query(collection(db, col), where('karyawanId', 'in', ids.slice(i, i + 30))));
      snap.forEach((d) => hasil.push(d.id));
    }
    return hasil;
  };
  const slipIds = await idsMilik('slipGaji');
  await deleteMany('slipGaji', slipIds);
  await deleteMany('pelunasanGaji', await idsMilik('pelunasanGaji'));
  await deleteMany('karyawan', ids);
  return slipIds.length;
};

// Tulis banyak dokumen sekaligus (maks. 500 per batch Firestore)
export const addMany = async (col, items) => {
  for (let i = 0; i < items.length; i += 500) {
    const batch = writeBatch(db);
    items.slice(i, i + 500).forEach((data) => {
      batch.set(doc(collection(db, col)), { ...data, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }
};
