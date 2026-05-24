import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signIn(email: string, pass: string) {
    await signInWithEmailAndPassword(auth, email, pass);
  }

  async function signUp(email: string, pass: string) {
    await createUserWithEmailAndPassword(auth, email, pass);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase auth error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
