/**
 * Authentication Context for Managing App Navigation Flow
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  hasSeenLanding: boolean;
  login: () => void;
  logout: () => void;
  setSeenLanding: (seen: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSeenLanding, setHasSeenLanding] = useState(false);

  // TODO: Implement token persistence and validation
  useEffect(() => {
    // Check if user is already logged in
    // Check if user has seen landing page before
    // This would typically load from AsyncStorage or device storage
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    setHasSeenLanding(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const value: AuthContextType = {
    isLoggedIn,
    hasSeenLanding,
    login,
    logout,
    setSeenLanding: setHasSeenLanding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
