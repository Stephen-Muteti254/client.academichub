import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface User { /* same as your type */ id: number; full_name: string; email: string; phone: string; country: string; subscription_level: string; role: string; }

interface AuthContextType {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // helper to clear
  const clearStorage = () => {

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);

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

    async function loadAuth() {

        try {

            const response = await api.get("/auth/me");

            if (!cancelled) {
                setUser(response.data);
            }

        } catch {

            if (!cancelled) {
                clearStorage();
            }

        } finally {

            if (!cancelled) {
                setIsLoading(false);
            }

        }
    }

    loadAuth();

    return () => {
        cancelled = true;
    };

  }, []);



  const validateToken = async (): Promise<boolean> => {
    if (!accessToken) return false;
    return validateTokenWithBackend();
  };

  const login = (userObj: User) => {
    setUser(userObj);
    localStorage.setItem(
        "user",
        JSON.stringify(userObj)
    );

};

  const logout = () => {
    // Ideally call backend logout endpoint if needed
    clearStorage();
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
