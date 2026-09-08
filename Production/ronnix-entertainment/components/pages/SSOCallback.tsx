import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { Rocket, AlertTriangle } from 'lucide-react';

export const SSOCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Finalizing Jump...');

    useEffect(() => {
        const performSSO = async () => {
            const token = searchParams.get('token');
            const statusParam = searchParams.get('status');
            const returnUrl = searchParams.get('returnUrl') || '/';

            // Case 1: Guest Mode or Fallback
            if (statusParam === 'guest') {
                navigate(returnUrl, { replace: true });
                return;
            }

            // Case 2: Error
            if (!token) {
                navigate(returnUrl, { replace: true });
                return;
            }

            // Case 3: Token present - Attempt Login
            try {
                await signInWithCustomToken(auth, token);
                setStatus('Docking Completed!');
                // Token sofort aus URL/History entfernen (kein Leak via Referrer/Logs)
                window.history.replaceState(null, '', window.location.pathname);
                // Instant redirect after success to minimize waiting time
                navigate(returnUrl, { replace: true });
            } catch (err: any) {
                console.error("SSO Failed", err);
                setError('Authentication failed. Entering as Guest.');
                setTimeout(() => navigate(returnUrl, { replace: true }), 1500);
            }
        };

        performSSO();
    }, [searchParams, navigate]);

    // Matches the visual style of WarpOverlay in Navbar.tsx for seamless transition
    return (
        <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black opacity-80"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                        <div className="absolute inset-0 bg-red-600 blur-2xl rounded-full animate-pulse"></div>
                        {error ? (
                            <AlertTriangle size={64} className="text-yellow-500 relative z-10" />
                        ) : (
                            <Rocket size={64} className="text-white relative z-10 animate-bounce" />
                        )}
                </div>
                
                <h2 className="text-3xl font-retro text-white tracking-widest uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                    {error ? 'Jump Failed' : 'Warp Drive Active'}
                </h2>
                <p className={`font-mono text-sm ${error ? 'text-yellow-500' : 'text-red-400 animate-pulse'}`}>
                    {error || status}
                </p>
            </div>
        </div>
    );
};