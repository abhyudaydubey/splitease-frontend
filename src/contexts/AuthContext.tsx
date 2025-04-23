import React, { createContext, useContext } from 'react';

// Define the user profile interface
export interface UserInfo {
  userId: string;
  username: string;
  email: string;
}

// Define the context shape
export interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userInfo: UserInfo | null;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  isLoading: boolean;
}

// Create context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 