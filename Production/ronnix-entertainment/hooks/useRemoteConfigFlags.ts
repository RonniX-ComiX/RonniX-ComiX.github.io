/**
 * hooks/useRemoteConfigFlags.ts — Feature-Flags aus Firebase Remote Config.
 *
 * Feature: liefert Cooldowns, Seitengrößen und Maintenance-Mode mit Defaults
 * (offline-sicher: Defaults bei Fehlern). Benutzung: `useRemoteConfigFlags()`
 * in `App.tsx` (MaintenanceBanner) und Profil/Kommentar-Flows.
 * Gehört NICHT hierher: Flag-Definitionen (Firebase-Konsole/Template).
 */

import { useEffect, useState } from 'react';
import { getValue } from 'firebase/remote-config';
import { remoteConfig } from '../firebase';

export interface RemoteFlags {
  cooldownHours: number;
  commentsPageSize: number;
  postsPageSize: number;
  maintenanceMode: boolean;
}

const defaults: RemoteFlags = {
  cooldownHours: 24,
  commentsPageSize: 20,
  postsPageSize: 12,
  maintenanceMode: false,
};

export const useRemoteConfigFlags = () => {
  const [flags, setFlags] = useState<RemoteFlags>(defaults);

  useEffect(() => {
    if (!remoteConfig) return;
    try {
      setFlags({
        cooldownHours: Number(getValue(remoteConfig, 'cooldown_hours').asString() || 24),
        commentsPageSize: Number(getValue(remoteConfig, 'comments_page_size').asString() || 20),
        postsPageSize: Number(getValue(remoteConfig, 'posts_page_size').asString() || 12),
        maintenanceMode: getValue(remoteConfig, 'maintenance_mode').asBoolean(),
      });
    } catch {}
  }, []);

  return flags;
};
