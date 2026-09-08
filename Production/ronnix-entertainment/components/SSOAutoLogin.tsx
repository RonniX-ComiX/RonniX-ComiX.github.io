import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentCategory } from '../utils/domainConfig';
import { useSearchParams } from 'react-router-dom';

export const SSOAutoLogin: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Only run if:
        // 1. Auth is done loading
        // 2. User is NOT logged in here
        // 3. We are NOT on the main domain (which is the auth authority)
        // 4. We haven't tried checking yet in this session
        if (!loading && !currentUser) {
            const category = getCurrentCategory();
            
            // Only run on sub-sites
            if (category !== 'main') {
                const hasChecked = sessionStorage.getItem('ronnix_sso_checked');
                // Check if we just came back from a logout
                const justLoggedOut = searchParams.get('logged_out') === 'true';
                
                if (justLoggedOut) {
                    // Mark as checked to prevent immediate re-login bounce
                    sessionStorage.setItem('ronnix_sso_checked', 'true');
                    return;
                }

                if (!hasChecked) {
                    // Mark as checked to prevent infinite loops
                    sessionStorage.setItem('ronnix_sso_checked', 'true');

                    // Construct bounce URL
                    // We send the user to main domain -> /sso-bounce
                    // Param 'callback': Where to send them back (here -> /sso)
                    // Param 'final_path': Where they actually are right now
                    
                    const mainDomain = 'https://ronnixentertainment.de';
                    const callbackUrl = `${window.location.origin}/sso`;
                    const finalPath = window.location.pathname + window.location.search;

                    const bounceUrl = `${mainDomain}/sso-bounce?callback=${encodeURIComponent(callbackUrl)}&final_path=${encodeURIComponent(finalPath)}`;

                    // Go!
                    window.location.href = bounceUrl;
                }
            }
        }
    }, [currentUser, loading, searchParams]);

    return null;
};