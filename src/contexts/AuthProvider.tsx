import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import { AuthContext, UserInfo } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Helper function to extract user info from token
  const extractUserInfoFromToken = (token: string): UserInfo | null => {
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.user) {
        return {
          userId: decoded.userId || decoded.user.id || decoded.user._id || '',
          username: decoded.user.username || '',
          email: decoded.user.useremail || decoded.user.email || ''
        };
      }
      return {
        userId: decoded.userId || decoded.id || decoded._id || '',
        username: decoded.username || '',
        email: decoded.useremail || decoded.email || ''
      };
    } catch (error) {
      console.error('Failed to extract user info from token:', error);
      return null;
    }
  };

  // Function to handle logout
  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId(null);
    setUserInfo(null);
    navigate('/login');
  };

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUserId(null);
      setUserInfo(null);
      setIsLoading(false);
      return false;
    }
    
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp) {
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          await logout();
          return false;
        }
      }
      
      const extractedUserInfo = extractUserInfoFromToken(token);
      if (!extractedUserInfo) {
        console.error('Failed to extract user info from token');
        await logout();
        return false;
      }
      
      setIsAuthenticated(true);
      setUserId(decoded.userId || extractedUserInfo.userId);
      setUserInfo(extractedUserInfo);
      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      await logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle login
  const login = async (token: string) => {
    setIsLoading(true);
    localStorage.setItem('token', token);
    
    try {
      const decoded: any = jwtDecode(token);
      const extractedUserInfo = extractUserInfoFromToken(token);
      setUserId(decoded.userId || '');
      setUserInfo(extractedUserInfo);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error decoding token:', error);
      toast.error('Invalid token received');
      setIsAuthenticated(false);
      setUserId(null);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check auth status on initial load
  useEffect(() => {
    checkAuth();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        setIsAuthenticated(false);
        setUserId(null);
        setUserInfo(null);
        navigate('/login');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        userId, 
        userInfo, 
        login, 
        logout, 
        checkAuth,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 