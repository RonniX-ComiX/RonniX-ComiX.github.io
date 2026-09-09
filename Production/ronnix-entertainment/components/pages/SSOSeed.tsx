/**
 * SSOSeed.tsx — Upstream-Sync: Session von Subdomain zur Main-Domain hochziehen.
 *
 * Feature: nach Login auf einer Subdomain (`AuthModal.syncSessionToMain`) landet der
 * User hier auf Main, meldet sich mit dem mitgebrachten Token an und kehrt per
 * `location.replace` zurück. Liest Token aus Fragment ODER Query, validiert die
 * Rücksprung-URL als volle Allowlist-URL (`sanitizeCallbackUrl`, kein offener
 * Redirect). Use Cases: Login auf ronnixcomix.de & Co. Benutzung: Route `/sso-seed`
 * (noIndex). Gehört NICHT hierher: Downstream-Weitergabe (SSOCallback/Bounce).
 */

import React, { useEffect, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { WarpScreen } from '../../components/WarpScreen';
import { extractSsoParams, sanitizeCallbackUrl, stripSsoParamsFromUrl } from '../../utils/ssoValidation';
import { getSsoMainOrigin } from '../../utils/ssoConfig';

export const SSOSeed: React.FC = () => {
    const [status, setStatus] = useState('Synchronisiere Hauptquartier...');
    const [error, setError] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const performSeed = async () => {
            const { token, returnUrl: _path } = extractSsoParams(window.location.search, window.location.hash);
            void _path;
            // Seed-Return ist eine volle URL zurück zur Subdomain → Allowlist-Check.
            const q = new URLSearchParams(window.location.search);
            const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const rawReturn = h.get('returnUrl') || q.get('returnUrl');
            const returnUrl = sanitizeCallbackUrl(rawReturn) ?? `${getSsoMainOrigin()}/`;

            if (!rawReturn) {
                setStatus('Fehler: Kein Zielort.');
                setError(true);
                return;
            }

            if (!token) {
                // If no token, just go back
                window.location.replace(returnUrl);
                return;
            }

            try {
                // Sign in on the Main Domain
                await signInWithCustomToken(auth, token);
                setStatus('Synchronisation erfolgreich!');
                stripSsoParamsFromUrl();
                setDone(true);
                // Immediately return (replace: kein Seed in der History)
                window.location.replace(returnUrl);
            } catch (err) {
                console.error("[sso] Seed-Login fehlgeschlagen", err);
                setStatus('Synchronisation fehlgeschlagen. Fahre lokal fort...');
                setError(true);
                // Fallback: Return anyway after short delay
                setTimeout(() => {
                    window.location.replace(returnUrl);
                }, 1200);
            }
        };

        performSeed();
    }, []);

    // Einheitlicher WarpScreen (System-Fonts, kein FOUT); Ziel = Rücksprung-Domain.
    const targetLabel = (() => {
        try {
            const q = new URLSearchParams(window.location.search);
            const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const raw = h.get('returnUrl') || q.get('returnUrl');
            return raw ? new URL(raw).hostname.toUpperCase() : null;
        } catch {
            return null;
        }
    })();

    return (
        <WarpScreen
            phase={error ? 'error' : done ? 'docking' : 'transfer'}
            targetLabel={targetLabel}
            message={error ? null : status}
            error={error ? status : null}
        />
    );
};
