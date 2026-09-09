/**
 * SSOAutoLogin.tsx — Stille Auto-Login-Prüfung auf Subdomains ohne sichtbaren Reload.
 *
 * Feature: prüft beim Betreten einer Subdomain (nicht Main, nicht localhost) unsichtbar
 * per Hidden-Iframe gegen die Main-Domain, ob dort eine Session existiert. Token kommt
 * per postMessage (nie URL/Logs), Gäste erzeugen KEINE Navigation. Nur wenn der stille
 * Check scheitert UND ein Login-Hinweis (`localStorage ronnix-sso-hint`) existiert,
 * gibt es einmalig den klassischen Full-Bounce als Fallback.
 * Use Cases: Erstbesuch auf ronnixcomix.de & Co. mit Main-Session. Benutzung: einmalig
 * in `App.tsx` gemountet (`<SSOAutoLogin />`). Gehört NICHT hierher: Bounce-Logik
 * selbst (`components/pages/SSOBounce.tsx`), Token-Erzeugung (Backend).
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getCurrentCategory, isLocalhost } from '../utils/domainConfig';
import { SSO_CONFIG } from '../utils/ssoConfig';
import { buildBounceUrl, stripSsoParamsFromUrl } from '../utils/ssoValidation';
import { isSsoAllowedOrigin } from '../utils/ssoConfig';
import { logError, logInfo, logWarn } from '../utils/logger';

interface SilentMessage {
  source?: string;
  status?: 'token' | 'guest';
  token?: string;
  returnUrl?: string;
}

export const SSOAutoLogin: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (isLocalhost()) return;
    if (loading || currentUser) return;
    if (!SSO_CONFIG.enableSilentCheck) return;
    if (getCurrentCategory() === 'main') return;

    // Frisch ausgeloggt → nicht sofort wieder einloggen.
    if (searchParams.get(SSO_CONFIG.loggedOutParam) === 'true') {
      try {
        sessionStorage.setItem(SSO_CONFIG.checkedKey, 'true');
      } catch { /* ignore */ }
      return;
    }
    try {
      if (sessionStorage.getItem(SSO_CONFIG.checkedKey)) return;
    } catch { /* ignore */ }

    started.current = true;
    const checkStartedAt = typeof performance !== 'undefined' ? performance.now() : 0;
    const elapsedMs = () => (checkStartedAt ? Math.round(performance.now() - checkStartedAt) : -1);
    logInfo('sso-autologin', '[sso] Silent-Check gestartet');

    const callbackUrl = `${window.location.origin}/sso`;
    const finalPath = window.location.pathname + window.location.search;
    const iframeSrc = buildBounceUrl(callbackUrl, finalPath, 'silent');

    let done = false;
    let iframe: HTMLIFrameElement | null = null;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      if (timer) window.clearTimeout(timer);
      if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
      iframe = null;
    };

    const markChecked = () => {
      try {
        sessionStorage.setItem(SSO_CONFIG.checkedKey, 'true');
      } catch { /* ignore */ }
    };

    /** Klassischer Full-Bounce, nur als Fallback bei Hinweis auf Session. */
    const fallbackBounce = () => {
      let hint = false;
      try {
        hint = !!localStorage.getItem(SSO_CONFIG.loginHintKey);
      } catch { /* ignore */ }
      markChecked();
      if (!hint) {
        logInfo('sso-autologin', '[sso] Silent-Check ohne Session, kein Bounce (Gast bleibt)');
        return;
      }
      logInfo('sso-autologin', '[sso] Silent-Check unklar trotz Login-Hinweis → Full-Bounce');
      window.location.replace(buildBounceUrl(callbackUrl, finalPath, 'full'));
    };

    const onMessage = async (event: MessageEvent<SilentMessage>) => {
      if (done) return;
      const data = event.data;
      if (!data || data.source !== 'ronnix-sso') return;
      if (!isSsoAllowedOrigin(event.origin)) return;
      if (iframe?.contentWindow && event.source !== iframe.contentWindow) return;

      if (data.status === 'guest') {
        done = true;
        logInfo('sso-autologin', '[sso] Silent-Check: Gast', { durationMs: elapsedMs() });
        markChecked();
        cleanup();
        return;
      }
      if (data.status === 'token' && data.token) {
        done = true;
        logInfo('sso-autologin', '[sso] Silent-Check: Token erhalten', { length: data.token.length, durationMs: elapsedMs() });
        try {
          await signInWithCustomToken(auth, data.token);
          stripSsoParamsFromUrl();
          logInfo('sso-autologin', '[sso] Silent-Login erfolgreich', { durationMs: elapsedMs() });
        } catch (e) {
          logError('sso-autologin', '[sso] Silent-Login fehlgeschlagen', e);
        }
        markChecked();
        cleanup();
      }
    };

    window.addEventListener('message', onMessage);
    iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.title = 'SSO';
    iframe.tabIndex = -1;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      logWarn('sso-autologin', '[sso] Silent-Check Timeout', { durationMs: elapsedMs() });
      cleanup();
      fallbackBounce();
    }, SSO_CONFIG.silentCheckTimeoutMs);

    return cleanup;
  }, [currentUser, loading, searchParams]);

  return null;
};
