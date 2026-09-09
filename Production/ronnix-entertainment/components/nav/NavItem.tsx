/**
 * nav/NavItem.tsx — Einzelner Navigations-Link mit SSO-Weitergabe.
 *
 * Feature: löst `href` via `getLinkUrl` auf (intern → `<Link>`, extern → `<a>`)
 * und gibt bei explizitem Klick auf eine Fremd-Domain die Session per
 * SSO-Token mit (Fragment-Transport, `location.replace`, Hover-Prefetch).
 * Gäste navigieren nativ. Meldet Warp-Start via `setGlobalWarp` (Paint-Brücke
 * bis zum Unload). Benutzung: in `Navbar.tsx` + `MobileDrawer.tsx`.
 * Gehört NICHT hierher: Farbwelt (`navStyles.ts`), Drawer-Layout (MobileDrawer).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCrossDomainToken } from '../../hooks/useCrossDomainToken';
import { getLinkUrl, isLocalhost } from '../../utils/domainConfig';
import type { IconName } from '../icons/Icon';
import { buildSsoUrl } from '../../utils/ssoValidation';
import { logError } from '../../utils/logger';

export interface NavItemProps {
  link: { name: string; href: string; icon: IconName };
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  isActive: boolean; // Receive active state as prop
  currentLang: string;
  setGlobalWarp: (active: boolean, targetLabel?: string | null) => void;
}

export const NavItem: React.FC<NavItemProps> = ({ link, className, children, onClick, isActive: _isActive, currentLang, setGlobalWarp }) => {
    void _isActive;
    const { currentUser } = useAuth();
    const { getToken, prefetch } = useCrossDomainToken();

    // Pass currentLang to getLinkUrl to append ?lang=... if external
    const { url, isExternal } = getLinkUrl(link.href, currentLang);

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Always close mobile menu immediately
        if (onClick) onClick();

        // SSO-Logik nur, wenn:
        // 1. Der Link extern ist (andere Domain)
        // 2. AND ein eingeloggter User seine Session mitnehmen muss.
        // 3. AND wir NICHT auf localhost sind (eine Origin = geteilter Login).

        if (isExternal && currentUser && !isLocalhost()) {
            e.preventDefault();
            // Overlay als Paint-Brücke bis zum Unload (kein künstliches Delay).
            try {
                setGlobalWarp(true, new URL(url).hostname.toUpperCase());
            } catch {
                setGlobalWarp(true, null);
            }

            try {
                // Fetch short-lived custom token from backend (Cache + Timeout in AuthContext)
                const token = await getToken();

                if (token) {
                    const targetUrl = new URL(url);
                    const returnPath = targetUrl.pathname + targetUrl.search;
                    // Fragment-Transport: Token nie im Query → nie in Server-Logs.
                    window.location.replace(buildSsoUrl(targetUrl.origin, token, returnPath));
                    return;
                }
                // Fallback if token fails
                window.location.replace(url);
            } catch (error) {
                logError('nav-item', '[sso] Navigations-Fehler, direkter Link als Fallback', error);
                window.location.replace(url);
            }
        }
        // GUEST MODE:
        // If external but NOT logged in, we do absolutely nothing special.
        // We let the browser handle the <a> tag naturally. This is instant.
    };

    if (isExternal) {
        return (
            <a
                href={url}
                className={className}
                onClick={handleClick}
                onMouseEnter={currentUser ? prefetch : undefined}
                onFocus={currentUser ? prefetch : undefined}
            >
                {children}
            </a>
        );
    }
    return (
        <Link to={url} className={className} onClick={onClick}>
            {children}
        </Link>
    );
};
