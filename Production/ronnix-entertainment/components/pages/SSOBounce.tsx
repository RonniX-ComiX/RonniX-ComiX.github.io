/**
 * SSOBounce.tsx — Auth-Authority auf der Main-Domain (sichtbar + still).
 *
 * Feature: `/sso-bounce?callback=...&final_path=...&mode=...`. Voll-Modus (klassisch):
 * volle Seite, Token via Fragment (`#token=`, nie Server-Logs) zurück an Callback.
 * Still-Modus (`mode=silent`, aus Hidden-Iframe): KEINE Navigation, Antwort per
 * postMessage an Parent (Token nie in URL). Gäste → `{status:'guest'}`.
 * Use Cases: Auto-Login (still), Fallback-Bounce (voll). Sicherheit: Callback gegen
 * Allowlist (`sanitizeCallbackUrl`), Fehler-Tipp nur in DEV, kein langes Blockieren.
 * Gehört NICHT hierher: Token-Erzeugung (Backend), Empfang (SilentCheck/Callback).
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WarpScreen } from '../../components/WarpScreen';
import {
  sanitizeCallbackUrl,
  sanitizeReturnUrl,
  buildSsoUrl,
} from '../../utils/ssoValidation';
import { isSsoAllowedOrigin } from '../../utils/ssoConfig';

export const SSOBounce: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { currentUser, loading, getCrossDomainToken } = useAuth();
    const [status, setStatus] = useState('Prüfe Sicherheitsfreigabe...');
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const mode = searchParams.get('mode');
    const isSilent = mode === 'silent';

    useEffect(() => {
        if (loading) return;

        const performBounce = async () => {
            // The URL where we want to send the result back (e.g. https://ronnixcomix.de/sso)
            const rawCallback = searchParams.get('callback');
            // The final path the user wanted to see (e.g. /post/123)
            const finalPath = sanitizeReturnUrl(searchParams.get('final_path') || '/');

            const callback = sanitizeCallbackUrl(rawCallback);
            if (!callback) {
                console.warn('[sso] Bounce ohne gültiges Callback');
                if (isSilent) return; // Parent läuft in Timeout → Gast, keine Navigation.
                setStatus('Fehler: Ungültiges Rücksprungziel.');
                return;
            }
            const targetOrigin = new URL(callback).origin;
            if (!isSsoAllowedOrigin(targetOrigin)) {
                if (isSilent) return;
                setStatus('Fehler: Ungültiges Rücksprungziel.');
                return;
            }

            // ---- Still-Modus: per postMessage antworten, nie navigieren ----
            if (isSilent) {
                if (currentUser) {
                    console.info('[sso] Silent-Bounce: User vorhanden, erzeuge Token');
                    try {
                        const token = await getCrossDomainToken();
                        if (token) {
                            window.parent.postMessage(
                                { source: 'ronnix-sso', status: 'token', token, returnUrl: finalPath },
                                targetOrigin,
                            );
                            console.info('[sso] Silent-Bounce: Token gesendet', { length: token.length });
                            return;
                        }
                        throw new Error('Token was empty');
                    } catch (e) {
                        console.error('[sso] Silent-Bounce Token-Fehler', e);
                    }
                } else {
                    console.info('[sso] Silent-Bounce: Gast');
                }
                window.parent.postMessage(
                    { source: 'ronnix-sso', status: 'guest', returnUrl: finalPath },
                    targetOrigin,
                );
                return;
            }

            // ---- Voll-Modus (Fallback): navigieren, Token im Fragment ----
            if (currentUser) {
                setStatus('Identität bestätigt. Generiere Passierschein...');
                try {
                    const token = await getCrossDomainToken();
                    if (token) {
                        window.location.replace(buildSsoUrl(targetOrigin, token, finalPath));
                        return;
                    }
                    throw new Error("Token was empty");
                } catch (e: any) {
                    console.error("[sso] Bounce Token-Fehler", e);
                    if (import.meta.env.DEV && e?.message && (String(e.message).includes('internal') || String(e.message).includes('permission'))) {
                         setStatus('Server-Fehler bei der Token-Erstellung.');
                         setErrorDetails('TIPP (nur DEV): "IAM Service Account Credentials API" in der Google Cloud Console aktivieren.');
                         await new Promise(r => setTimeout(r, 1500));
                    }
                }
            }

            // Fallback (Not logged in OR Error): Redirect back as guest
            const targetUrl = new URL(callback);
            targetUrl.searchParams.set('status', 'guest');
            targetUrl.searchParams.set('returnUrl', finalPath);
            window.location.replace(targetUrl.toString());
        };

        performBounce();
    }, [currentUser, loading, getCrossDomainToken, searchParams, isSilent]);

    // Still-Modus: minimale Seite, damit das Iframe schnell lädt.
    if (isSilent) return null;

    // Vollmodus im einheitlichen WarpScreen (System-Fonts, kein FOUT).
    const targetLabel = (() => {
        try {
            const raw = searchParams.get('callback');
            return raw ? new URL(raw).hostname.toUpperCase() : null;
        } catch {
            return null;
        }
    })();
    const failed = status.startsWith('Fehler') || status.startsWith('Server-Fehler');

    return (
        <WarpScreen
            phase={failed ? 'error' : loading ? 'preparing' : 'transfer'}
            targetLabel={targetLabel}
            message={failed ? null : status}
            error={failed ? (errorDetails ? `${status} ${errorDetails}` : status) : null}
        />
    );
};
