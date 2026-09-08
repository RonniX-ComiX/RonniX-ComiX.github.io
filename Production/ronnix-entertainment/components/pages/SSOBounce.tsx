import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

export const SSOBounce: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { currentUser, loading, getCrossDomainToken } = useAuth();
    const [status, setStatus] = useState('Prüfe Sicherheitsfreigabe...');
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    useEffect(() => {
        if (loading) return;

        const performBounce = async () => {
            // The URL where we want to send the result back (e.g. https://ronnixcomix.de/sso)
            const returnCallback = searchParams.get('callback');
            // The final path the user wanted to see (e.g. /post/123)
            const finalPath = searchParams.get('final_path') || '/';

            if (!returnCallback) {
                setStatus('Fehler: Kein Rücksprungziel definiert.');
                return;
            }

            if (currentUser) {
                setStatus('Identität bestätigt. Generiere Passierschein...');
                try {
                    const token = await getCrossDomainToken();
                    if (token) {
                        // Success: Redirect back with token
                        const targetUrl = new URL(returnCallback);
                        targetUrl.searchParams.set('token', token);
                        targetUrl.searchParams.set('returnUrl', finalPath);
                        
                        window.location.replace(targetUrl.toString());
                        return;
                    } else {
                        throw new Error("Token was empty");
                    }
                } catch (e: any) {
                    console.error("Bounce Token Error", e);
                    
                    // Show detailed error for debugging if it looks like a config issue
                    if (e.message && (e.message.includes('internal') || e.message.includes('permission'))) {
                         setStatus('Server-Fehler bei der Token-Erstellung.');
                         setErrorDetails('TIPP: Hast du die "IAM Service Account Credentials API" in der Google Cloud Console aktiviert?');
                         
                         // Wait 5 seconds so the developer can read the error, then redirect as guest
                         await new Promise(r => setTimeout(r, 6000));
                    }
                }
            }

            // Fallback (Not logged in OR Error): Redirect back as guest
            const targetUrl = new URL(returnCallback);
            targetUrl.searchParams.set('status', 'guest');
            targetUrl.searchParams.set('returnUrl', finalPath);
            window.location.replace(targetUrl.toString());
        };

        performBounce();
    }, [currentUser, loading, getCrossDomainToken, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-6">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full animate-pulse"></div>
                    <img src="/favicons/android-chrome-192x192.png" alt="Logo" className="w-24 h-24 relative z-10" />
                </div>
                
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center max-w-md shadow-2xl">
                    <h2 className="text-2xl font-retro text-white mb-4">RonniX Central Core</h2>
                    
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                        {errorDetails ? (
                             <AlertTriangle className="text-yellow-500 w-10 h-10 mb-2" />
                        ) : loading ? (
                            <Loader2 className="animate-spin text-red-500 w-8 h-8" />
                        ) : currentUser ? (
                            <ShieldCheck className="text-green-500 w-8 h-8" />
                        ) : (
                            <XCircle className="text-gray-500 w-8 h-8" />
                        )}
                        
                        <p className="text-lg font-bold">{status}</p>
                        
                        {errorDetails && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-200">
                                {errorDetails}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};