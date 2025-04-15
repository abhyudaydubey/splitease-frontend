import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

// Define the user profile interface
interface UserInfo {
  userId: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userInfo: UserInfo | null;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  isLoading: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check if token exists and is valid on initial load
  useEffect(() => {
    // Immediately run the auth check on mount
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    
    initAuth();
    
    // Listen for storage events to handle logout in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        // Token was removed in another tab
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

  const extractUserInfoFromToken = (token: string): UserInfo | null => {
    try {
      const decoded: any = jwtDecode(token);

      // Based on the token structure, the user info is in a 'user' property
      if (decoded.user) {
        return {
          userId: decoded.userId || decoded.user.id || decoded.user._id || '',
          username: decoded.user.username || '',
          email: decoded.user.useremail || decoded.user.email || ''
        };
      }
      
      // Fallback if structure is different
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

  // Make checkAuth async to properly handle promises
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUserId(null);
      setUserInfo(null);
      return false;
    }
    
    try {
      // Verify token and check expiration
      const decoded: any = jwtDecode(token);
      
      // Check for token expiration if exp field exists
      if (decoded.exp) {
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token has expired
          await logout();
          return false;
        }
      }
      
      // Extract user info from token
      const extractedUserInfo = extractUserInfoFromToken(token);
      
      if (!extractedUserInfo) {
        console.error('Failed to extract user info from token');
        await logout();
        return false;
      }
      
      // Token is valid
      setIsAuthenticated(true);
      setUserId(decoded.userId || extractedUserInfo.userId);
      setUserInfo(extractedUserInfo);
      return true;
    } catch (error) {
      // Invalid token
      console.error('Invalid token:', error);
      await logout();
      return false;
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    
    try {
      const decoded: any = jwtDecode(token);
      
      // Extract user info from token
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
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId'); // Remove other auth-related items if any
    
    setIsAuthenticated(false);
    setUserId(null);
    setUserInfo(null);
    
    // Don't navigate during initial load
    if (!isLoading) {
      navigate('/login');
    }
  };

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