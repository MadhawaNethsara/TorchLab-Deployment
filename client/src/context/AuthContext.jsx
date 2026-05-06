import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest, fetchCurrentUser } from '../api/auth';
import { clearAuth, getToken, setToken } from '../lib/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    fetchCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [navigate]);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    if (!data?.token) {
      throw new Error('Login response missing token');
    }
    setToken(data.token);
    setUser(data.user ?? null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
