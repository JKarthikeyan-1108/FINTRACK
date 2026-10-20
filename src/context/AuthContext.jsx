import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../firebase/config';
import { onFirebaseIdToken, firebaseSignOut, firebaseEmailSignIn, firebaseEmailSignUp, firebaseGoogleSignIn, firebasePasswordReset, firebasePhoneSignIn, firebaseVerifyOtp, firebaseSendEmailVerification } from '../firebase/authService';
import { setMoneyFormat } from '../lib/format';

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

const AUTH_STORAGE_KEY = 'fintrack_auth_session';

function getStoredAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.token && session?.user) {
      const payload = parseJWT(session.token);
      if (payload?.exp && payload.exp > Math.floor(Date.now() / 1000)) {
        return session;
      }
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }) {
  const initialSession = getStoredAuthSession();
  const [user, setUser] = useState(() => initialSession?.user || null);
  const [token, setToken] = useState(() => initialSession?.token || null);
  const [tokenPayload, setTokenPayload] = useState(() => initialSession?.token ? parseJWT(initialSession.token) : null);
  const [secsLeft, setSecsLeft] = useState(3600);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const commitSession = (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    if (tokenVal && userVal) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: tokenVal, user: userVal }));
      } catch {}
      if (userVal.currency) {
        setMoneyFormat({ currency: userVal.currency, locale: userVal.date_format || 'en-IN' });
      }
    } else {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
    }
  };

  const handleAuthSuccess = async (firebaseUser, customName) => {
    if (!firebaseUser) return null;
    const idToken = await firebaseUser.getIdToken();
    const nextUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      avatar_url: firebaseUser.photoURL,
      phone: firebaseUser.phoneNumber,
      emailVerified: firebaseUser.emailVerified,
      currency: 'INR',
      date_format: 'en-IN',
    };
    commitSession(idToken, nextUser);

    try {
      const { data } = await authAPI.me();
      if (data && data.user) {
        const merged = { ...nextUser, ...data.user, emailVerified: firebaseUser.emailVerified };
        commitSession(idToken, merged);
      }
    } catch {
      // Profile initialized on first API call
    }
    return nextUser;
  };

  useEffect(() => {
    setTokenPayload(token ? parseJWT(token) : null);
  }, [token]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!tokenPayload?.exp) {
      setSecsLeft(3600);
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, tokenPayload.exp - Math.floor(Date.now() / 1000));
      setSecsLeft(seconds);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [tokenPayload]);

  useEffect(() => {
    // Firebase Auth listener
    const unsubscribe = onFirebaseIdToken(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await handleAuthSuccess(firebaseUser);
        } catch (e) {
          console.error('Error fetching token:', e);
        }
      } else {
        // If not in demo mode (JWT token without Firebase user), clear
        if (!localStorage.getItem(AUTH_STORAGE_KEY)?.includes('demo_user')) {
          // Firebase actively reports signed out
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const googleLogin = async () => {
    setLoading(true);
    try {
      const fbUser = await firebaseGoogleSignIn();
      return await handleAuthSuccess(fbUser);
    } finally {
      setLoading(false);
    }
  };

  const emailLogin = async (email, password) => {
    setLoading(true);
    try {
      const fbUser = await firebaseEmailSignIn(email, password);
      return await handleAuthSuccess(fbUser);
    } finally {
      setLoading(false);
    }
  };

  const emailRegister = async (name, email, password) => {
    setLoading(true);
    try {
      const fbUser = await firebaseEmailSignUp(name, email, password);
      return await handleAuthSuccess(fbUser, name);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    await firebasePasswordReset(email);
  };

  const sendVerificationEmail = async () => {
    await firebaseSendEmailVerification();
  };

  const deleteAccount = async () => {
    await authAPI.deleteAccount();
    await logout();
  };

  const phoneLogin = async (phoneNumber) => {
    await firebasePhoneSignIn(phoneNumber);
  };

  const verifyOtp = async (code) => {
    await firebaseVerifyOtp(code);
  };

  const logout = async () => {
    commitSession(null, null);
    await firebaseSignOut().catch(() => {});
  };

  const demoLogin = (profileKey = 'karthik') => {
    const isKarthik = profileKey === 'karthik';
    const demoUser = {
      uid: isKarthik ? 'demo_user_123' : `demo_user_${Date.now()}`,
      email: isKarthik ? 'karthik@fintrack.app' : 'investor@fintrack.app',
      name: isKarthik ? 'Karthik (Demo Pro)' : 'Arjun Sharma',
      avatar_url: null,
      currency: 'INR',
      date_format: 'en-IN',
      emailVerified: true,
      role: 'pro',
    };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ uid: demoUser.uid, email: demoUser.email, exp: Math.floor(Date.now() / 1000) + 86400 * 14 }));
    const mockToken = `${header}.${payload}.signature`;
    commitSession(mockToken, demoUser);
    return demoUser;
  };

  const refreshToken = useCallback(async () => {
    try {
      if (auth?.currentUser) {
        const freshToken = await auth.currentUser.getIdToken(true);
        setToken(freshToken);
        return freshToken;
      }
    } catch {
      return null;
    }
  }, []);

  const updateProfile = async (data) => {
    const { data: result } = await authAPI.updateProfile(data);
    if (result.user) {
      setUser(prev => ({ ...prev, ...result.user }));
      if (result.user.currency) {
        setMoneyFormat({ currency: result.user.currency, locale: result.user.date_format });
      }
    }
    return result;
  };

  const tokenStatus = secsLeft <= CRITICAL_SECS ? 'critical' : secsLeft <= WARN_SECS ? 'warning' : 'valid';

  const fmtCountdown = (seconds = 0) => {
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
        secsLeft,
        tokenStatus,
        fmtCountdown,
        refreshToken,
        loading,
        isAuthenticated: !!token && !!user,
        phoneLogin,
        verifyOtp,
        googleLogin,
        emailLogin,
        emailRegister,
        forgotPassword,
        sendVerificationEmail,
        deleteAccount,
        updateProfile,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

