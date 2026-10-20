import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ApiError,
  clearToken,
  fetchMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  setToken,
  signup as apiSignup,
  type User,
} from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchMe()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setUser(user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const { token, user } = await apiSignup(name, email, password);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    // Best-effort: revoke the session server-side, but don't make the user wait
    // on it -- clearing the local token already logs this browser out immediately.
    apiLogout().catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
