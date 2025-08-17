import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          apiService.setAuthToken(storedToken);
          const response = await apiService.verifyToken();
          setAdmin(response.admin);
          setToken(storedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          apiService.clearAuthToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login(email, password);
      setAdmin(response.admin);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      apiService.setAuthToken(response.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('token');
    apiService.clearAuthToken();
  };

  const value: AuthContextType = {
    admin,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};