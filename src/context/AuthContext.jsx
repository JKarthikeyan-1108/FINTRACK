import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const WARN_SECS = 300;
const CRITICAL_SECS = 60;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('fintrack_token'));
  const [tokenPayload, setTokenPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secsLeft, setSecsLeft] = useState(9999);
  const timerRef = useRef(null);

  useEffect(() => {
    setTokenPayload(token ? parseJWT(token) : null);
  }, [token]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!tokenPayload?.exp) {
      setSecsLeft(9999);
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, tokenPayload.exp - Math.floor(Date.now() / 1000));
      setSecsLeft(seconds);
      if (seconds === 0) {
        clearInterval(timerRef.current);
        setToken(null);
        setUser(null);
        localStorage.removeItem('fintrack_token');
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [tokenPayload]);

  useEffect(() => {
    const stored = localStorage.getItem('fintrack_token');
    if (!stored) {
      setLoading(false);
      return;
    }

    const payload = parseJWT(stored);
    const valid = payload?.exp && payload.exp > Math.floor(Date.now() / 1000);
    if (!valid) {
      localStorage.removeItem('fintrack_token');
      setLoading(false);
      return;
    }

    setToken(stored);
    authAPI.me()
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('fintrack_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const saveToken = useCallback((nextToken, nextUser) => {
    localStorage.setItem('fintrack_token', nextToken);
    setToken(nextToken);
    if (nextUser) setUser(nextUser);
  }, []);

  const sendOTP = async phone => {
    const { data } = await authAPI.sendOTP(phone);
    return data;
  };

  const verifyOTP = async (phone, otp) => {
    const { data } = await authAPI.verifyOTP(phone, otp);
    saveToken(data.access_token, data.user);
    return data;
  };

  const googleLogin = async payload => {
    const { data } = await authAPI.google(payload);
    saveToken(data.access_token, data.user);
    return data;
  };

  const emailLogin = async (email, password) => {
    const { data } = await authAPI.emailLogin(email, password);
    saveToken(data.access_token, data.user);
    return data;
  };

  const emailRegister = async (name, email, password) => {
    const { data } = await authAPI.emailRegister(name, email, password);
    saveToken(data.access_token, data.user);
    return data;
  };

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await authAPI.refresh();
      saveToken(data.access_token);
      return data;
    } catch {
      return null;
    }
  }, [saveToken]);

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('fintrack_token');
    setToken(null);
    setUser(null);
    setTokenPayload(null);
  };

  const tokenStatus = secsLeft <= CRITICAL_SECS ? 'critical' : secsLeft <= WARN_SECS ? 'warning' : 'valid';

  const fmtCountdown = seconds => {
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokenPayload,
        loading,
        isAuthenticated: !!token && !!user,
        secsLeft,
        tokenStatus,
        fmtCountdown,
        sendOTP,
        verifyOTP,
        googleLogin,
        emailLogin,
        emailRegister,
        refreshToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
