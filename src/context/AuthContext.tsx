/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('email');

        if (storedToken && storedEmail) {
          apiService.setAuthToken(storedToken);
          setAdmin({
            id: '1', // placeholder
            email: storedEmail,
            name: 'External Admin',
            role: 'super-admin',
            lastLogin: new Date().toISOString(),
          });
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('email');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.login(email, password);

      const adminData: Admin = {
        id: '1', // placeholder
        email: response.email,
        name: 'External Admin',
        role: 'super-admin',
        lastLogin: new Date().toISOString(),
      };

      setAdmin(adminData);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('email', response.email);
      apiService.setAuthToken(response.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    apiService.clearAuthToken();
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await apiService.changePassword(oldPassword, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    admin,
    token,
    login,
    logout,
    changePassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
