
import React, { useState, useEffect } from 'react';
import { updateEmail, updatePassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { User, Save, CheckCircle, PlusCircle, Link as LinkIcon, Lock, Shield, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { auth, db, functions } from '../../firebase';
import { Link } from 'react-router-dom';

export const UserProfile: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  
  // General Profile State
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [successProfile, setSuccessProfile] = useState(false);

  // Cooldown State
  const [lastUsernameUpdate, setLastUsernameUpdate] = useState<Date | null>(null);
  const [lastAvatarUpdate, setLastAvatarUpdate] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  // Security State
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [successSecurity, setSuccessSecurity] = useState(false);
  const [securityError, setSecurityError] = useState('');

  // 24 Hours in milliseconds
  const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Timer for countdown
    const timer = setInterval(() => setNow(new Date()), 1000);

    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhotoURL(currentUser.photoURL || '');
      setEmail(currentUser.email || '');

      // Fetch cooldown data from Firestore
      const fetchUserData = async () => {
          try {
              const docRef = doc(db, 'users', currentUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.lastUsernameUpdate) setLastUsernameUpdate(data.lastUsernameUpdate.toDate());
                  if (data.lastAvatarUpdate) setLastAvatarUpdate(data.lastAvatarUpdate.toDate());
                  
                  // Sync local state with Firestore if available (truth source)
                  if (data.displayName) setDisplayName(data.displayName);
                  if (data.photoURL) setPhotoURL(data.photoURL);
              }
          } catch (e) {
              console.error("Error fetching user data", e);
          }
      };
      fetchUserData();
    }
    return () => clearInterval(timer);
  }, [currentUser]);

  // Helper to calculate remaining time
  const getRemainingTime = (lastUpdate: Date | null) => {
      if (!lastUpdate) return 0;
      const diff = COOLDOWN_PERIOD - (now.getTime() - lastUpdate.getTime());
      return diff > 0 ? diff : 0;
  };

  const formatDuration = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
  };

  const nameCooldown = getRemainingTime(lastUsernameUpdate);
  const avatarCooldown = getRemainingTime(lastAvatarUpdate);

  const canUpdateName = nameCooldown === 0;
  const canUpdateAvatar = avatarCooldown === 0;


  // Handle General Profile Update via Function (serverseitiger 24h-Cooldown)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const nameChanged = displayName !== auth.currentUser.displayName;
    const avatarChanged = photoURL !== auth.currentUser.photoURL;

    if (nameChanged && !canUpdateName) return;
    if (avatarChanged && !canUpdateAvatar) return;
    if (!nameChanged && !avatarChanged) return;

    setLoadingProfile(true);
    setSuccessProfile(false);

    try {
      const fn = httpsCallable(functions, 'updateProfileWithCooldown');
      await fn({ displayName, photoURL });
      if (nameChanged) setLastUsernameUpdate(new Date());
      if (avatarChanged) setLastAvatarUpdate(new Date());
      // Auth-State refreshen (displayName/photoURL)
      await auth.currentUser.reload().catch(() => {});
      setSuccessProfile(true);
      setTimeout(() => setSuccessProfile(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile", error);
      if (error?.code === 'functions/failed-precondition') {
        alert('Cooldown aktiv (24h) – bitte später erneut versuchen.');
      }
    }
    setLoadingProfile(false);
  };

  // Handle Security Update (Email & Password)
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSecurityError('');
    setSuccessSecurity(false);

    if (newPassword && newPassword !== confirmPassword) {
        setSecurityError(t.authModal.profile.passwordMismatch);
        return;
    }

    setLoadingSecurity(true);

    try {
        const promises = [];

        // Update Email if changed
        if (email !== currentUser?.email) {
            promises.push(updateEmail(auth.currentUser, email));
        }

        // Update Password if provided
        if (newPassword) {
            promises.push(updatePassword(auth.currentUser, newPassword));
        }

        if (promises.length > 0) {
            await Promise.all(promises);
            setSuccessSecurity(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessSecurity(false), 3000);
        }

    } catch (error: any) {
        console.error("Error updating security settings", error);
        if (error.code === 'auth/requires-recent-login') {
            setSecurityError(t.authModal.profile.reauthError);
        } else if (error.code === 'auth/email-already-in-use') {
            setSecurityError(t.authModal.errors.emailInUse);
        } else if (error.code === 'auth/weak-password') {
            setSecurityError(t.authModal.errors.weakPassword);
        } else {
            setSecurityError(t.authModal.errors.generic);
        }
    }
    setLoadingSecurity(false);
  };

  if (!currentUser) {
      return (
          <div className="container mx-auto px-6 py-12 text-center">
              <p className="text-gray-400">{t.home.common.loginRequired}</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-6 py-12 text-gray-300 min-h-[60vh]">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={t.authModal.profile.title} />

        {/* ADMIN SHORTCUTS */}
        {isAdmin && (
            <div className="mb-8 animate-fade-in bg-neutral-900/50 p-6 rounded-2xl border border-red-900/30">
                <Link 
                    to="/create"
                    className="w-full flex items-center justify-center gap-3 bg-neutral-800 border-2 border-dashed border-red-900/50 hover:border-red-600 hover:bg-neutral-800/80 text-white p-4 rounded-xl transition-all group"
                >
                    <div className="bg-red-600 p-2 rounded-full group-hover:scale-110 transition-transform">
                        <PlusCircle size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-retro text-xl tracking-wide">{t.home.admin.createTitle}</h3>
                        <p className="text-xs text-gray-400">{t.home.common.adminAreaDesc}</p>
                    </div>
                </Link>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: GENERAL PROFILE */}
            <div className="bg-neutral-900/50 p-8 rounded-2xl border border-red-900/20 shadow-2xl animate-fade-in h-fit relative overflow-hidden">
                
                {/* Warning Banner */}
                <div className="bg-yellow-900/30 border-l-4 border-yellow-600 p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                        <p className="text-sm text-yellow-200">{t.authModal.profile.cooldownWarning}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 text-red-500 border-b border-red-900/30 pb-2">
                    <User size={24} />
                    <h3 className="font-retro text-xl tracking-wide text-white">{t.authModal.profile.generalTitle}</h3>
                </div>

                {/* Avatar Preview */}
                <div className="flex justify-center mb-8">
                    <div className="relative group">
                        <div className={`w-32 h-32 rounded-full bg-neutral-800 border-4 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.5)] ${!canUpdateAvatar ? 'border-gray-600 grayscale' : 'border-red-600'}`}>
                            {photoURL ? (
                                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-gray-500" />
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Username Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-red-500 uppercase">{t.authModal.profile.currentName}</label>
                            {!canUpdateName && (
                                <span className="flex items-center gap-1 text-xs text-yellow-500 font-mono bg-black px-2 py-0.5 rounded border border-yellow-900">
                                    <Clock size={12} /> {formatDuration(nameCooldown)}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <User className={`absolute left-3 top-3 ${!canUpdateName ? 'text-gray-600' : 'text-gray-500'}`} size={18} />
                            <input 
                            type="text" 
                            required
                            disabled={!canUpdateName}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={`w-full bg-black border text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-colors placeholder-gray-600 ${
                                !canUpdateName 
                                ? 'border-neutral-800 text-gray-500 cursor-not-allowed' 
                                : 'border-neutral-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            }`}
                            />
                            {!canUpdateName && <Lock className="absolute right-3 top-3 text-gray-600" size={18} />}
                        </div>
                    </div>

                    {/* Avatar URL Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-red-500 uppercase">{t.authModal.profile.avatarLabel}</label>
                            {!canUpdateAvatar && (
                                <span className="flex items-center gap-1 text-xs text-yellow-500 font-mono bg-black px-2 py-0.5 rounded border border-yellow-900">
                                    <Clock size={12} /> {formatDuration(avatarCooldown)}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <LinkIcon className={`absolute left-3 top-3 ${!canUpdateAvatar ? 'text-gray-600' : 'text-gray-500'}`} size={18} />
                            <input 
                            type="text" 
                            disabled={!canUpdateAvatar}
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                            placeholder="https://..."
                            className={`w-full bg-black border text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-colors placeholder-gray-600 ${
                                !canUpdateAvatar 
                                ? 'border-neutral-800 text-gray-500 cursor-not-allowed' 
                                : 'border-neutral-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            }`}
                            />
                            {!canUpdateAvatar && <Lock className="absolute right-3 top-3 text-gray-600" size={18} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {t.authModal.profile.avatarHint} <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-red-400 hover:underline">imgbb.com</a>
                        </p>
                    </div>

                    {successProfile && (
                        <div className="bg-green-900/20 border border-green-600/50 text-green-400 p-3 rounded-lg flex items-center justify-center gap-2 text-sm animate-pulse">
                            <CheckCircle size={16} />
                            {t.authModal.profile.updateSuccess}
                        </div>
                    )}

                    <button 
                    type="submit" 
                    disabled={loadingProfile || (!canUpdateName && !canUpdateAvatar)}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loadingProfile ? '...' : (
                        <>
                            <Save size={18} /> {t.authModal.profile.updateBtn}
                        </>
                    )}
                    </button>
                </form>
            </div>

            {/* COLUMN 2: SECURITY */}
            <div className="bg-neutral-900/50 p-8 rounded-2xl border border-red-900/20 shadow-2xl animate-fade-in h-fit" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2 mb-6 text-red-500 border-b border-red-900/30 pb-2">
                    <Shield size={24} />
                    <h3 className="font-retro text-xl tracking-wide text-white">{t.authModal.profile.securityTitle}</h3>
                </div>

                <form onSubmit={handleUpdateSecurity} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-bold text-red-500 uppercase">{t.authModal.profile.emailLabel}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-red-500 uppercase">{t.authModal.profile.newPasswordLabel}</label>
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-bold text-red-500 uppercase">{t.authModal.profile.confirmPasswordLabel}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
                            />
                        </div>
                    </div>

                    {securityError && (
                        <div className="bg-red-900/20 border border-red-600/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {securityError}
                        </div>
                    )}

                    {successSecurity && (
                        <div className="bg-green-900/20 border border-green-600/50 text-green-400 p-3 rounded-lg flex items-center justify-center gap-2 text-sm animate-pulse">
                            <CheckCircle size={16} />
                            {t.authModal.profile.securitySuccess}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loadingSecurity}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                    {loadingSecurity ? '...' : (
                        <>
                            <Shield size={18} /> {t.authModal.profile.securityBtn}
                        </>
                    )}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
