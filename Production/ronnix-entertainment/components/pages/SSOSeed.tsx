import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const SSOSeed: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('Synchronisiere Hauptquartier...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const performSeed = async () => {
            const token = searchParams.get('token');
            const returnUrl = searchParams.get('returnUrl');

            if (!returnUrl) {
                setStatus('Fehler: Kein Zielort.');
                setError(true);
                return;
            }

            if (!token) {
                // If no token, just go back
                window.location.href = returnUrl;
                return;
            }

            try {
                // Sign in on the Main Domain
                await signInWithCustomToken(auth, token);
                setStatus('Synchronisation erfolgreich!');
                
                // Immediately return
                window.location.href = returnUrl;
            } catch (err) {
                console.error("SSO Seed Failed", err);
                setStatus('Synchronisation fehlgeschlagen. Fahre lokal fort...');
                setError(true);
                // Fallback: Return anyway after short delay
                setTimeout(() => {
                    window.location.href = returnUrl;
                }, 2000);
            }
        };

        performSeed();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-6">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center max-w-md shadow-2xl relative overflow-hidden">
                   {error ? (
                       <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                   ) : (
                       <div className="relative mx-auto mb-4 w-16 h-16">
                           <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
                           <Loader2 className="w-16 h-16 text-red-600 animate-spin relative z-10" />
                       </div>
                   )}
                   
                   <h2 className="text-2xl font-retro text-white mb-4">RonniX Link</h2>
                   <p className="text-gray-400">{status}</p>
                </div>
            </div>
        </div>
    );
};