import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
  onAuthChanged,
  getUserData,
  type FirebaseUser
} from '@/lib/firebase';

// Define user type
export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  plan: string;
  createdAt?: Date;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          
          if (userData) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || userData.email,
              username: userData.username,
              name: userData.name,
              plan: userData.plan || 'Base',
              createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : undefined,
            });
          } else {
            // If no user data found, just use Firebase user info
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              plan: 'Base',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userData = await getUserData(user.id);
      if (userData) {
        setUser({
          ...user,
          plan: userData.plan || user.plan,
          name: userData.name || user.name,
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await loginWithEmail(email, password);
      // Auth state listener will handle setting the user
      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login');
    }
  };

  const register = async (username: string, email: string, password: string, name?: string) => {
    try {
      await registerWithEmail(email, password, { username, name });
      // Auth state listener will handle setting the user
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register');
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  // Return the provider with the value
  return React.createElement(AuthContext.Provider, {
    value: {
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }
  }, children);
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default useAuth;
