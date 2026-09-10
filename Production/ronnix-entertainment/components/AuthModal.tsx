/**
 * AuthModal.tsx — Login/Registrierung (E-Mail + Google) mit Upstream-Seed.
 *
 * Feature: meldet an, spiegelt Profil nach Firestore (`users` + PII-frei
 * `usersPrivate`), stößt auf Subdomains den Upstream-Seed zur Main-Domain an
 * (`/sso-seed`, Fragment-Transport, `location.replace`). Google nutzt Popup mit
 * Redirect-Fallback; dessen Abschluss sichert global `AuthProvider` (Redirect-
 * Rückkehr landet ohne offenes Modal). Gehört NICHT hierher: Token-Erzeugung
 * (AuthContext), Seed-Empfang (SSOSeed).
 */

import React, { useState } from 'react';
import { Icon } from './icons/Icon';
import { auth, googleProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentCategory, isLocalhost } from '../utils/domainConfig';
import { versionedAssetUrl } from '../utils/appConfig';
import { buildSeedUrl } from '../utils/ssoValidation';
import { logError, logWarn } from '../utils/logger';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { t } = useLanguage();
  const { getCrossDomainToken } = useAuth(); // Needed for SSO Seed

  if (!isOpen) return null;

  // Helper to sync user to Firestore (PII-frei: email -> usersPrivate)
  const syncUserToFirestore = async (user: any, name?: string) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        displayName: name || user.displayName || 'Anonymous Hero',
        photoURL: user.photoURL || '',
    }, { merge: true });
    // PII separat, nur Owner/Admin lesbar (siehe firestore.rules usersPrivate)
    if (user.email) {
      await setDoc(doc(db, 'usersPrivate', user.uid), {
        email: user.email,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});
    }
  };

  // Helper to sync session to Main Domain (The "Seed")
  // Auf localhost deaktiviert: eine Origin = geteilter Login, kein Seed nötig.
  const syncSessionToMain = async () => {
      if (isLocalhost()) return false;
      const category = getCurrentCategory();

      // If we are NOT on the main domain, we must push the session upstream
      if (category !== 'main') {
          // Keep loading true to prevent UI flicker
          setLoading(true);
          try {
             const token = await getCrossDomainToken();
             if (token) {
                 // Seed mit Fragment-Transport (Token nie im Query) + replace (kein Seed in History)
                 window.location.replace(buildSeedUrl(token, window.location.href));
                 return true; // Redirecting...
             }
          } catch (e) {
              logWarn('auth-modal', 'Seed-Weiterleitung fehlgeschlagen, bleibe lokal', e);
              // Fallback: Just close modal and stay local
          }
      }
      return false; // No redirect happened
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: username
            });
            await syncUserToFirestore(auth.currentUser, username);
            // E-Mail-Verifizierung (Pflicht für Votes/Comments/Profile-Functions)
            await sendEmailVerification(auth.currentUser).catch(() => {});
        }
      }
      
      // Attempt Upstream Sync
      const isRedirecting = await syncSessionToMain();
      if (!isRedirecting) {
          onClose();
          setLoading(false);
      }
      
    } catch (err: any) {
      logError('auth-modal', 'E-Mail-Login fehlgeschlagen', err);
      handleError(err);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          // Popup primär, Redirect-Fallback für Mobile/3rd-Party-Cookie-Block
          let user = null;
          try {
            const result = await signInWithPopup(auth, googleProvider);
            user = result.user;
          } catch (popupErr: any) {
            if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/popup-closed-by-user' || popupErr?.code === 'auth/unauthorized-domain') {
              await signInWithRedirect(auth, googleProvider);
              return;
            }
            throw popupErr;
          }
          // Redirect-Rückkehr (falls vorher Redirect genutzt)
          const redirectRes = await getRedirectResult(auth).catch(() => null);
          user = user || redirectRes?.user || auth.currentUser;
          if (user) await syncUserToFirestore(user);
          
          // Attempt Upstream Sync
          const isRedirecting = await syncSessionToMain();
          if (!isRedirecting) {
              onClose();
              setLoading(false);
          }
      } catch (err: any) {
          logError('auth-modal', 'Google-Login fehlgeschlagen', err);
          handleError(err);
          setLoading(false);
      }
  }

  const handleError = (err: any) => {
      let msg = t.authModal.errors.generic;
      
      if (err.code === 'auth/invalid-email') msg = t.authModal.errors.invalidEmail;
      if (err.code === 'auth/user-not-found') msg = t.authModal.errors.userNotFound;
      if (err.code === 'auth/wrong-password') msg = t.authModal.errors.wrongPassword;
      if (err.code === 'auth/email-already-in-use') msg = t.authModal.errors.emailInUse;
      if (err.code === 'auth/weak-password') msg = t.authModal.errors.weakPassword;
      if (err.code === 'auth/unauthorized-domain') msg = t.authModal.errors.unauthorizedDomain;
      if (err.code === 'auth/popup-closed-by-user') msg = t.authModal.errors.popupClosed;
      
      setError(msg);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-red-600 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden animate-fade-in">
        
        {/* Loading Overlay for SSO Seed */}
        {loading && !error && (
            <div className="absolute inset-0 bg-neutral-950/80 z-50 flex flex-col items-center justify-center animate-fade-in">
                <Icon name="loader" className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-white font-retro tracking-wide animate-pulse">
                    {t.authModal.loading}
                </p>
            </div>
        )}

        {/* Header */}
        <div className="bg-red-900/20 p-6 text-center border-b border-red-900/30 relative">
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-50 p-2 disabled:opacity-0"
          >
            <Icon name="x" size={24} />
          </button>
          <h2 className="text-3xl font-retro text-white tracking-wide drop-shadow-md">
            {isLogin ? t.authModal.welcomeBack : t.authModal.joinCrew}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {isLogin ? t.authModal.loginSub : t.authModal.signupSub}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-600/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="alert-circle" size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 mb-6 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <img src={versionedAssetUrl('/images/google.svg')} alt="Google" loading="lazy" decoding="async" className="w-5 h-5" />
            {t.authModal.googleBtn}
          </button>
          
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-neutral-700"></div>
            <span className="flex-shrink mx-4 text-neutral-500 text-xs uppercase">{t.authModal.or}</span>
            <div className="flex-grow border-t border-neutral-700"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
               <div className="space-y-1">
                  <label htmlFor="auth-username" className="text-xs font-bold text-gray-400 uppercase">{t.authModal.username}</label>
                 <div className="relative">
                   <Icon name="user" className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      id="auth-username"
                      type="text"
                      required
                      value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition placeholder-gray-500"
                     placeholder={t.authModal.usernamePlaceholder}
                   />
                 </div>
               </div>
            )}

            <div className="space-y-1">
               <label htmlFor="auth-email" className="text-xs font-bold text-gray-400 uppercase">{t.authModal.email}</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-3 text-gray-500" size={18} />
                 <input
                   id="auth-email"
                   type="email"
                   required
                   value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition placeholder-gray-500"
                  placeholder={t.authModal.emailPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-1">
               <label htmlFor="auth-password" className="text-xs font-bold text-gray-400 uppercase">{t.authModal.password}</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-3 text-gray-500" size={18} />
                 <input
                   id="auth-password"
                   type="password"
                   required
                   value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition placeholder-gray-500"
                  placeholder={t.authModal.passwordPlaceholder}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 rounded-lg transform transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogin ? t.authModal.loginBtn : t.authModal.registerBtn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              {isLogin ? t.authModal.noAccount : t.authModal.hasAccount}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                disabled={loading}
                className="ml-2 text-red-500 font-bold hover:text-red-400 hover:underline transition-colors disabled:opacity-50"
              >
                {isLogin ? t.authModal.toRegister : t.authModal.toLogin}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};