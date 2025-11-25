import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- Interface Definitions ---
interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// --- Mock Data ---
const MOCK_TOKEN_KEY = 'wot_auth_token';
const MOCK_USER_ID = 'sme-7f89d3';
const MOCK_USER_NAME = 'Mama Ngozi';

// --- Create Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to simulate login (storing token)
  const login = useCallback((token: string) => {
    localStorage.setItem(MOCK_TOKEN_KEY, token);
    setIsAuthenticated(true);
    setUser({ id: MOCK_USER_ID, name: MOCK_USER_NAME });
  }, []);

  // Function to simulate logout
  const logout = useCallback(() => {
    localStorage.removeItem(MOCK_TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Check initial authentication state on mount
  useEffect(() => {
    const token = localStorage.getItem(MOCK_TOKEN_KEY);
    if (token) {
      // In a real app: Call BE endpoint to validate JWT
      login(token);
    }
    setIsLoading(false);
  }, [login]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook to use Auth Context ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};