/**
 * post/AdminCreateButton.tsx — Kontextueller „+ Post"-Button für Kategorie-Seiten.
 *
 * Feature: nur für Admins sichtbar (`useAuth().isAdmin`), linkt auf
 * `/create?category=<kat>` (bzw. `/en/create?...`, Sprache bleibt erhalten),
 * damit `CreatePost` die Kategorie vorbelegt. Reine Darstellung (kein Fetch).
 * Benutzung: oben in jeder Section (`NewsSection`, `ComicsSection`, …) hinter
 * `SectionTitle`. Gehört NICHT hierher: Erstell-Logik (`pages/CreatePost.tsx`),
 * Listen-Fetch (`hooks/useCachedPosts.ts`).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizePath } from '../../utils/domainConfig';
import { POST_CATEGORIES } from '../../utils/appConfig';
import { Icon } from '../icons/Icon';

export interface AdminCreateButtonProps {
  /** Firestore-Kategorie dieser Section (`news|comics|books|games|movies|series`). */
  category: string;
}

/**
 * Admin-Shortcut zum Erstellen (mit Kategorie-Prefill via Query).
 * @param category Kategorie-Key der aktuellen Section.
 * @returns Link-Button oder `null` (kein Admin).
 */
export const AdminCreateButton: React.FC<AdminCreateButtonProps> = ({ category }) => {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();

  if (!isAdmin) return null;
  if (!(POST_CATEGORIES as readonly string[]).includes(category)) return null;

  const target = localizePath(`/create?category=${encodeURIComponent(category)}`, language);
  const label = (t as any)?.home?.admin?.createTitle || 'Neuen Beitrag erstellen';

  return (
    <div className="flex justify-end px-4 mb-4">
      <Link
        to={target}
        className="inline-flex items-center gap-2 bg-neutral-900/80 border-2 border-dashed border-red-900/50 hover:border-red-500 hover:bg-neutral-900 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
        title={label}
      >
        <span className="bg-red-600 p-1 rounded-full flex items-center justify-center">
          <Icon name="plus-circle" size={16} />
        </span>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">+ Post</span>
      </Link>
    </div>
  );
};
