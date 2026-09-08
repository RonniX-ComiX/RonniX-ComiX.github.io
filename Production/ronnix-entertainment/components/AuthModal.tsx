import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentCategory } from '../utils/domainConfig';

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

  // Helper to sync user to Firestore
  const syncUserToFirestore = async (user: any, name?: string) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        displayName: name || user.displayName || 'Anonymous Hero',
        photoURL: user.photoURL || '',
        email: user.email 
    }, { merge: true });
  };

  // NEW: Helper to sync session to Main Domain (The "Seed")
  const syncSessionToMain = async () => {
      const category = getCurrentCategory();
      
      // If we are NOT on the main domain, we must push the session upstream
      if (category !== 'main') {
          // Keep loading true to prevent UI flicker
          setLoading(true);
          try {
             const token = await getCrossDomainToken();
             if (token) {
                 const mainDomain = 'https://ronnixentertainment.de';
                 const returnUrl = window.location.href;
                 // Redirect to seed endpoint
                 window.location.href = `${mainDomain}/sso-seed?token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`;
                 return true; // Redirecting...
             }
          } catch (e) {
              console.error("SSO Seed Failed", e);
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: username
            });
            await syncUserToFirestore(auth.currentUser, username);
        }
      }
      
      // Attempt Upstream Sync
      const isRedirecting = await syncSessionToMain();
      if (!isRedirecting) {
          onClose();
          setLoading(false);
      }
      
    } catch (err: any) {
      console.error(err);
      handleError(err);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          const result = await signInWithPopup(auth, googleProvider);
          await syncUserToFirestore(result.user);
          
          // Attempt Upstream Sync
          const isRedirecting = await syncSessionToMain();
          if (!isRedirecting) {
              onClose();
              setLoading(false);
          }
      } catch (err: any) {
          console.error(err);
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
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
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
            <X size={24} />
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
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 mb-6 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
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
                 <label className="text-xs font-bold text-gray-500 uppercase">{t.authModal.username}</label>
                 <div className="relative">
                   <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                   <input 
                     type="text" 
                     required
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-gray-700"
                     placeholder={t.authModal.usernamePlaceholder}
                   />
                 </div>
               </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t.authModal.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-gray-700"
                  placeholder={t.authModal.emailPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t.authModal.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-gray-700"
                  placeholder={t.authModal.passwordPlaceholder}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 rounded-lg transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogin ? t.authModal.loginBtn : t.authModal.registerBtn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
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