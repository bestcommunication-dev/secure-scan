import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

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
  login: (email: string, password: string) => Promise<any>;
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
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // TEMPORANEO: Inizializza direttamente con un utente mock per saltare il login
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-1',
    email: 'demo@example.com',
    username: 'demo',
    name: 'Utente Demo',
    plan: 'Premium', 
    createdAt: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(false); // Inizia come false perché abbiamo già un utente
  
  // Stampa lo stato utente per debug
  useEffect(() => {
    console.log("IMPORTANTE: Modalità di sviluppo attiva - Utente pre-autenticato");
    console.log("Utente attuale:", user);
  }, []);

  // Temporary function to mock login - REMOVE when Firebase keys are available
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Create a mock user
      const mockUser = {
        id: '1',
        email,
        username: email.split('@')[0],
        plan: 'Premium',
        createdAt: new Date()
      };
      
      setUser(mockUser);
      console.log('Mock login successful:', mockUser);
      return { user: mockUser };
    } catch (error: any) {
      console.error('Mock login error:', error);
      throw new Error('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  // Temporary function to mock register - REMOVE when Firebase keys are available
  const register = async (username: string, email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Create a mock user
      const mockUser = {
        id: '1',
        email,
        username,
        name: name || username,
        plan: 'Base',
        createdAt: new Date()
      };
      
      setUser(mockUser);
      console.log('Mock register successful:', mockUser);
    } catch (error: any) {
      console.error('Mock register error:', error);
      throw new Error('Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  // Temporary function to mock logout - REMOVE when Firebase keys are available
  const logout = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUser(null);
      console.log('Mock logout successful');
    } catch (error: any) {
      console.error('Mock logout error:', error);
      throw new Error('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Temporary function to mock refresh user - REMOVE when Firebase keys are available
  const refreshUser = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log('Mock refresh user successful');
    } catch (error) {
      console.error('Mock refresh user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Per debugging
function logAuthState() {
  const auth = useContext(AuthContext);
  console.log("Auth state:", {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading
  });
  return auth;
}

// Hook to use auth context
export const useAuth = () => logAuthState();

export default useAuth;