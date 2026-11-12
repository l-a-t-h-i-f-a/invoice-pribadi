import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Catat akun yang login ke koleksi `pengguna` supaya muncul di halaman Pengguna
const catatPengguna = async (u) => {
  const ref = doc(db, 'pengguna', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) await updateDoc(ref, { terakhirMasuk: serverTimestamp() });
  else await setDoc(ref, { email: u.email, dibuatOleh: '', createdAt: serverTimestamp(), terakhirMasuk: serverTimestamp() });
};
import Loader from '../components/Loader';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
        if (u) catatPengguna(u).catch(() => {}); // jangan ganggu login kalau gagal
      }),
    [],
  );

  const value = {
    user,
    login: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    register: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
    logout: () => signOut(auth),
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader full /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
