/**
 * GlobalLogout.tsx — Globaler Logout auf der Main-Domain mit Rücksprung.
 *
 * Feature: widerruft serverseitig Refresh-Tokens (`globalSignOut` → `logoutSignals`),
 * meldet lokal ab und kehrt per `location.replace` zur Herkunft zurück (mit
 * `?logged_out=true`, damit `SSOAutoLogin` nicht sofort wieder einloggt).
 * Rücksprung-URL wird gegen Allowlist validiert (`sanitizeCallbackUrl`).
 * Use Cases: Logout von Subdomain (Redirect hierher) + direkt auf Main.
 * Gehört NICHT hierher: Logout-Erkennung auf anderen Domains (AuthContext-Listener).
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { logError, logWarn } from '../../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../firebase';
import { WarpScreen } from '../../components/WarpScreen';
import { sanitizeCallbackUrl } from '../../utils/ssoValidation';
import { SSO_CONFIG } from '../../utils/ssoConfig';
import { clearSsoTokenCache } from '../../context/AuthContext';

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
                        logWarn("global-logout", "Cloud revocation failed, continuing with local signout", e);
                    }
                }

                // 2. Sign out locally on Main Domain
                clearSsoTokenCache();
                try {
                    localStorage.removeItem(SSO_CONFIG.loginHintKey);
                    sessionStorage.setItem(SSO_CONFIG.checkedKey, 'true');
                } catch { /* ignore */ }
                await signOut(auth);

                setStatus('Erfolgreich ausgeloggt.');

                // 3. Redirect back to origin if provided (allowlist-validiert)
                const rawReturn = searchParams.get('returnUrl');
                const returnUrl = sanitizeCallbackUrl(rawReturn);
                if (returnUrl) {
                    // Append a flag so the destination knows we just logged out
                    const urlObj = new URL(returnUrl);
                    urlObj.searchParams.set(SSO_CONFIG.loggedOutParam, 'true');

                    setTimeout(() => {
                        window.location.replace(urlObj.toString());
                    }, 800);
                } else {
                    // Stay on main page
                    setTimeout(() => {
                        window.location.replace('/');
                    }, 800);
                }

            } catch (error) {
                logError("global-logout", "Global Logout Error", error);
                setStatus('Fehler beim Ausloggen.');
            }
        };

        performGlobalLogout();
    }, [searchParams]);

    // Einheitlicher WarpScreen (System-Fonts, kein FOUT); Fehler als Error-Phase.
    const failed = status.startsWith('Fehler');
    return (
        <WarpScreen
            phase={failed ? 'error' : 'transfer'}
            message={failed ? null : status}
            error={failed ? status : null}
        />
    );
};
