import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { loginWithCredentials, joinClass } from '../services/mockDatabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  joinClassroom: (code: string) => Promise<boolean>;
  selectClass: (code: string | null) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const userData = await loginWithCredentials(email, pass);
    if (userData) {
      setUser(userData);
      return true;
    }
    return false;
  };

  const joinClassroom = async (code: string): Promise<boolean> => {
    if (!user) return false;
    const success = await joinClass(user.id, code);
    if (success) {
      // Update local state to reflect new class list and active class
      setUser({ 
        ...user, 
        enrolledClassCodes: [...user.enrolledClassCodes, code],
        classCode: code 
      });
    }
    return success;
  };

  const selectClass = (code: string | null) => {
    if (!user) return;
    setUser({ ...user, classCode: code || undefined });
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, joinClassroom, selectClass, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};