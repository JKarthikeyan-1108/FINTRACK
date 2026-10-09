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

// Firebase Auth fully replaces the backend auth endpoints for login/registration.
import { onFirebaseIdToken, firebaseSignOut, firebaseEmailSignIn, firebaseEmailSignUp, firebaseGoogleSignIn, firebasePasswordReset, firebasePhoneSignIn, firebaseVerifyOtp } from '../firebase/authService';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth listener
    const unsubscribe = onFirebaseIdToken(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          phone: firebaseUser.phoneNumber
        });
        
        // Try to fetch extended profile from backend if needed
        try {
          const { data } = await authAPI.me();
          if (data && data.user) {
            setUser(prev => ({ ...prev, ...data.user }));
          }
        } catch (e) { /* ignore */ }
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
    // Not needed. Firebase sends an email link directly.
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

  const updateProfile = async (data) => {
    const { data: result } = await authAPI.updateProfile(data);
    if (result.user) setUser(prev => ({ ...prev, ...result.user }));
    return result;
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
