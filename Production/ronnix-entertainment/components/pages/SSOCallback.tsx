/**
 * SSOCallback.tsx — SSO-Landeplatz auf der Ziel-Domain (explizite Wechsel).
 *
 * Feature: liest Token aus Fragment (`#token=`, Standard) ODER Query (Fallback für
 * alte Links), meldet per `signInWithCustomToken` an, strippt sensible Parameter und
 * navigiert zum validierten `returnUrl` (`sanitizeReturnUrl` gegen offenen Redirect).
 * Use Cases: Navbar-Wechsel, ExternalRedirect, Full-Bounce-Fallback. Benutzung: Route
 * `/sso` (noIndex). Gehört NICHT hierher: stiller Auto-Login (SSOAutoLogin/Iframe).
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { WarpScreen, WarpPhase } from '../../components/WarpScreen';
import { extractSsoParams, stripSsoParamsFromUrl } from '../../utils/ssoValidation';
import { logError, logInfo } from '../../utils/logger';

export const SSOCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { hash } = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [phase, setPhase] = useState<WarpPhase>('transfer');

    useEffect(() => {
        const performSSO = async () => {
            const exchangeStartedAt = typeof performance !== 'undefined' ? performance.now() : 0;
            const elapsedMs = () => (exchangeStartedAt ? Math.round(performance.now() - exchangeStartedAt) : -1);
            const { token, status: statusParam, returnUrl } =
                extractSsoParams(searchParams.toString(), hash);
            logInfo('sso-callback', '[sso] Callback erreicht', { hasToken: !!token, status: statusParam ?? null });

            // Case 1: Guest Mode or Fallback
            if (statusParam === 'guest') {
                stripSsoParamsFromUrl();
                navigate(returnUrl, { replace: true });
                return;
            }

            // Case 2: Error
            if (!token) {
                stripSsoParamsFromUrl();
                navigate(returnUrl, { replace: true });
                return;
            }

            // Case 3: Token present - Attempt Login
            try {
                await signInWithCustomToken(auth, token);
                setPhase('docking');
                logInfo('sso-callback', '[sso] Callback-Exchange erfolgreich', { durationMs: elapsedMs() });
                // Token sofort aus URL/History entfernen (kein Leak via Referrer/Logs)
                stripSsoParamsFromUrl();
                // Instant redirect after success to minimize waiting time
                navigate(returnUrl, { replace: true });
            } catch (err: any) {
                logError('sso-callback', "[sso] Callback-Login fehlgeschlagen", { err, durationMs: elapsedMs() });
                setError('Authentication failed. Entering as Guest.');
                stripSsoParamsFromUrl();
                setTimeout(() => navigate(returnUrl, { replace: true }), 1500);
            }
        };

        performSSO();
    }, [searchParams, hash, navigate]);

    // Einheitlicher WarpScreen (System-Fonts, kein FOUT); Zielsektor = diese Domain.
    const targetLabel = (() => {
        try {
            return window.location.hostname.toUpperCase();
        } catch {
            return null;
        }
    })();

    return <WarpScreen phase={phase} targetLabel={targetLabel} error={error || null} />;
};
