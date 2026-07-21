import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { PORTALS } from "@/config/portals";
import { clearAuth } from "@/services/authService";

interface User { /* same as your type */ id: number; full_name: string; email: string; phone: string; country: string; subscription_level: string; role: string; }

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (user: User, token: string, remember?: boolean) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // helper to clear
  const clearStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    setUser(null);
    setAccessToken(null);
    delete api.defaults.headers.common['Authorization'];
  };

  // robust validator: only clear on explicit 401/403 or explicit invalid token response
  const validateTokenWithBackend = async (): Promise<boolean> => {
    try {
      const response = await api.get('/auth/me');

      const userData = response.data;

      if (response.status === 200 && userData?.id) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data || err?.message;

      if (status === 401 || status === 403) {
        clearStorage();
      }

      return false;
    }
  };


  // load on mount
  useEffect(() => {
    let cancelled = false;

    const loadAuthState = async () => {
      const storedToken =
        localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const storedUser =
        localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          const isValid = await validateTokenWithBackend();
          if (!cancelled) {
            if (isValid) {
              setAccessToken(storedToken);
            } else {
              clearStorage();
            }
          }
        } catch {
          if (!cancelled) clearStorage();
        }
      }
 else {
        clearStorage();
      }

      if (!cancelled) setIsLoading(false);
    };

    loadAuthState();

    return () => {
      cancelled = true;
    };
  }, []);



  const validateToken = async (): Promise<boolean> => {
    if (!accessToken) return false;
    return validateTokenWithBackend();
  };

  const login = (userObj: User, token: string, remember = true) => {
    setUser(userObj);
    setAccessToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    if (remember) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
    } else {
      sessionStorage.setItem('access_token', token);
      sessionStorage.setItem('user', JSON.stringify(userObj));
    }
  };

  const logout = () => {
    clearAuth();
    window.location.replace(PORTALS.AUTH);
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
