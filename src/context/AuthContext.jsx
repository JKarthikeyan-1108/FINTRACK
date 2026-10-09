import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../firebase/config';
import { onFirebaseIdToken, firebaseSignOut, firebaseEmailSignIn, firebaseEmailSignUp, firebaseGoogleSignIn, firebasePasswordReset, firebasePhoneSignIn, firebaseVerifyOtp } from '../firebase/authService';

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
  const [token, setToken] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [secsLeft, setSecsLeft] = useState(3600);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

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
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar_url: firebaseUser.photoURL,
            phone: firebaseUser.phoneNumber
          });
          
          // Try to fetch extended profile from backend if available
          try {
            const { data } = await authAPI.me();
            if (data && data.user) {
              setUser(prev => ({ ...prev, ...data.user }));
            }
          } catch (e) { /* ignore backend profile fetch errors */ }
        } catch (e) {
          console.error('Error fetching token:', e);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const googleLogin = async () => {
    await firebaseGoogleSignIn();
  };

  const emailLogin = async (email, password) => {
    await firebaseEmailSignIn(email, password);
  };

  const emailRegister = async (name, email, password) => {
    await firebaseEmailSignUp(name, email, password);
  };

  const forgotPassword = async (email) => {
    await firebasePasswordReset(email);
  };

  const resetPassword = async (email, token, newPassword) => {
    throw new Error('Please check your email for the password reset link.');
  };

  const phoneLogin = async (phoneNumber) => {
    await firebasePhoneSignIn(phoneNumber);
  };

  const verifyOtp = async (code) => {
    await firebaseVerifyOtp(code);
  };

  const logout = async () => {
    await firebaseSignOut();
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
    if (result.user) setUser(prev => ({ ...prev, ...result.user }));
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
        resetPassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

