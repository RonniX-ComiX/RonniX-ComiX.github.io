import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../firebase';
import { LogOut, Loader2 } from 'lucide-react';

export const GlobalLogout: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('Beende Sitzung im gesamten RonniX Universum...');
    
    useEffect(() => {
        const performGlobalLogout = async () => {
            try {
                // 1. Call Cloud Function to revoke refresh tokens (kills sessions on other devices/domains)
                // We only try this if we are actually logged in
                if (auth.currentUser) {
                    try {
                        const globalSignOutFn = httpsCallable(functions, 'globalSignOut');
                        await globalSignOutFn();
                    } catch (e) {
                        console.warn("Cloud revocation failed, continuing with local signout", e);
                    }
                }

                // 2. Sign out locally on Main Domain
                await signOut(auth);

                setStatus('Erfolgreich ausgeloggt.');

                // 3. Redirect back to origin if provided
                const returnUrl = searchParams.get('returnUrl');
                if (returnUrl) {
                    // Append a flag so the destination knows we just logged out
                    const urlObj = new URL(returnUrl);
                    urlObj.searchParams.set('logged_out', 'true');
                    
                    setTimeout(() => {
                        window.location.href = urlObj.toString();
                    }, 800);
                } else {
                    // Stay on main page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 800);
                }

            } catch (error) {
                console.error("Global Logout Error", error);
                setStatus('Fehler beim Ausloggen.');
            }
        };

        performGlobalLogout();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-6">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                 <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center max-w-md shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                    
                    <LogOut className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-retro text-white mb-4">Logout in Progress</h2>
                    <p className="text-gray-400 mb-6">{status}</p>
                    
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin text-red-500" size={24} />
                    </div>
                 </div>
            </div>
        </div>
    );
};