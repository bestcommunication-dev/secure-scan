// This is the real implementation for Firebase functionality

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseAuthUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_FjjGqPCI87xEWkL00Irld21auENY8DA",
  authDomain: "dev-scan-security.firebaseapp.com",
  projectId: "dev-scan-security",
  storageBucket: "dev-scan-security.firebasestorage.app",
  messagingSenderId: "333689599343",
  appId: "1:333689599343:web:3cb2177c4b4380e489649a"
};

export type FirebaseUser = FirebaseAuthUser;

export type UserCredential = {
  user: FirebaseUser;
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const loginWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result;
};

export const registerWithEmail = async (
  email: string, 
  password: string, 
  userData: { username: string; name?: string }
): Promise<UserCredential> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update user profile
  if (result.user) {
    await updateProfile(result.user, {
      displayName: userData.name || userData.username
    });

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: email,
      username: userData.username,
      name: userData.name || userData.username,
      createdAt: new Date().toISOString(),
      plan: 'free'
    });
  }

  return result;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserData = async (userId: string) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const updateUserPlan = async (userId: string, plan: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { plan });
};

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
