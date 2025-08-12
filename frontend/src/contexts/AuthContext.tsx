import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { getCurrentUser, logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: RootState['auth']['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  handleLogout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, token } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Check if user is authenticated on app load
    // Only try to get current user if we have a token and are not already authenticated
    if (token && !isAuthenticated && !isLoading) {
      // Add a timeout to prevent infinite loading if backend is not available
      const timeoutId = setTimeout(() => {
        dispatch(getCurrentUser());
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [dispatch, token, isAuthenticated, isLoading]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const clearError = () => {
    dispatch({ type: 'auth/clearError' });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    handleLogout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 