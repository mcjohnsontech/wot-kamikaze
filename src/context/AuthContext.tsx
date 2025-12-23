import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// --- Interface Definitions ---
interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null;
  login: (token: string, userInfo?: { id: string; name: string }) => void;
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
  const login = useCallback((token: string, userInfo?: { id: string; name: string }) => {
    localStorage.setItem(MOCK_TOKEN_KEY, token);
    setIsAuthenticated(true);
    if (userInfo) setUser(userInfo);
    else setUser({ id: MOCK_USER_ID, name: MOCK_USER_NAME });
  }, []);

  // Function to simulate logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // silent
    }
    localStorage.removeItem(MOCK_TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Check initial authentication state on mount
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        const token = session?.access_token;
        if (token && mounted) {
          const user = session.user;
          const name = (user?.user_metadata as any)?.name || user?.email || MOCK_USER_NAME;
          login(token, { id: user.id, name });
        } else {
          const stored = localStorage.getItem(MOCK_TOKEN_KEY);
          if (stored && mounted) login(stored);
        }
      } catch (err) {
        const stored = localStorage.getItem(MOCK_TOKEN_KEY);
        if (stored && mounted) login(stored);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        const user = session.user;
        const name = (user?.user_metadata as any)?.name || user?.email || MOCK_USER_NAME;
        localStorage.setItem(MOCK_TOKEN_KEY, session.access_token);
        setIsAuthenticated(true);
        setUser({ id: user.id, name });
      } else {
        localStorage.removeItem(MOCK_TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      // unsubscribe listener
      try {
        authListener.subscription.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
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