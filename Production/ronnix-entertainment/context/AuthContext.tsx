
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCurrentCategory } from '../utils/domainConfig';

// Hardcoded Admin UID matches firestore.rules
// Optimizes backend usage by avoiding a DB read for every page load
const ADMIN_UID = 'nRMiuZsj4GZQ0siYXFOqXVCc7mB2';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  getCrossDomainToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Optimization: Check UID directly instead of fetching DB document
        if (user.uid === ADMIN_UID) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. Realtime Global Logout Listener
  // Watch for the 'lastLogoutAt' timestamp in Firestore. If it's newer than our login, force logout.
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Keep onSnapshot here as it is a critical security feature (Global SignOut)
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastLogoutAt) {
                const lastLogoutTime = data.lastLogoutAt.toDate().getTime();
                
                // When did this specific browser session start?
                const currentSessionTime = new Date(currentUser.metadata.lastSignInTime || 0).getTime();

                // Buffer of 2 seconds to avoid race conditions during the logout process itself
                if (lastLogoutTime > currentSessionTime + 2000) {
                    console.log("Global logout detected. Signing out local session...");
                    firebaseSignOut(auth).then(() => {
                         window.location.href = '/';
                    });
                }
            }
        }
    });

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  const logout = async () => {
    // 1. Sign out locally immediately
    await firebaseSignOut(auth);

    // 2. Determine if we need a Global Logout Redirect
    const currentCategory = getCurrentCategory();
    
    if (currentCategory !== 'main') {
        const mainDomain = 'https://ronnixentertainment.de';
        const returnUrl = window.location.href; 
        
        sessionStorage.setItem('ronnix_logged_out', 'true');
        
        window.location.href = `${mainDomain}/global-logout?returnUrl=${encodeURIComponent(returnUrl)}`;
    } else {
       try {
           const globalSignOutFn = httpsCallable(functions, 'globalSignOut');
           await globalSignOutFn();
       } catch (e) {
           console.error("Global SignOut Backend Error", e);
       }
    }
  };

  const getCrossDomainToken = async (): Promise<string | null> => {
    if (!currentUser) {
        console.warn("SSO: No user logged in, cannot generate token.");
        return null;
    }
    try {
        const generateToken = httpsCallable<void, { token: string }>(functions, 'generateCrossDomainToken');
        const result = await generateToken();
        return result.data.token;
    } catch (error: any) {
        console.error("SSO Token Generation Failed:", error);
        return null;
    }
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    logout,
    getCrossDomainToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
