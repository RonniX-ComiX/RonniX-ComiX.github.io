/**
 * post/CommentNotifyToggle.tsx — Opt-in für In-App-Kommentar-Benachrichtigungen.
 *
 * Feature: Toggle pro Post (`commentSubscriptions/{postId}_{uid}`), speichert
 * nur `notifyReplies` (keine E-Mail, kein Versand). Liest/schreibt nur das
 * eigene Doc (Rules sichern Owner-Zugriff). Zeigt Gästen einen Login-Hinweis
 * statt Toggle (kein Layout-Sprung). Benutzung: in `PostDetail` über den
 * Comments (`PostComments`). Gehört NICHT hierher: Fan-out in In-App-Items
 * (Functions `onCommentCreated`), Kommentar-Liste (`PostComments.tsx`).
 */

import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Icon } from '../icons/Icon';
import { logError } from '../../utils/logger';

export interface CommentNotifyToggleProps {
  /** Post-ID für Sub-Key (`{postId}_{uid}`). */
  postId: string;
  /** Eingeloggter User oder `null` (Gast → Hinweis). */
  currentUser: any;
  /** Locale-Dict (`t`, optional — Fallback DE/EN). */
  t?: any;
}

/**
 * Toggle für Kommentar-Benachrichtigungen (eigene Subscription).
 * @param postId Post-ID.
 * @param currentUser Firebase-User oder Falsy.
 * @param t Locale-Dict.
 * @returns Toggle-Card oder Gast-Hinweis.
 */
export const CommentNotifyToggle: React.FC<CommentNotifyToggleProps> = ({ postId, currentUser, t }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const title = t?.home?.postDetail?.notifyTitle || 'Bei neuen Kommentaren benachrichtigen';
  const desc = t?.home?.postDetail?.notifyDesc || 'In-App-Hinweis bei Antworten auf diesen Post (jederzeit abbestellbar).';
  const loginHint = t?.home?.postDetail?.loginToComment || 'Logge dich ein, um mitzudiskutieren!';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser || !postId) { setLoading(false); return; }
      setLoading(true);
      try {
        const ref = doc(db, 'commentSubscriptions', `${postId}_${currentUser.uid}`);
        const snap = await getDoc(ref);
        if (!cancelled) setEnabled(snap.exists());
      } catch (e) {
        logError('comment-notify', 'load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [postId, currentUser]);

  const toggle = async () => {
    if (!currentUser || !postId || saving) return;
    setSaving(true);
    const ref = doc(db, 'commentSubscriptions', `${postId}_${currentUser.uid}`);
    try {
      if (enabled) {
        await deleteDoc(ref);
        setEnabled(false);
      } else {
        await setDoc(ref, {
          postId,
          uid: currentUser.uid,
          notifyReplies: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setEnabled(true);
      }
    } catch (e) {
      logError('comment-notify', 'toggle failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="mb-4 text-xs text-gray-500 flex items-center gap-2" aria-live="polite">
        <Icon name="message-square" size={14} /> {loginHint}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-3 bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={toggle}
        disabled={loading || saving}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
          enabled ? 'bg-red-700 border-red-500' : 'bg-neutral-800 border-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${
            enabled ? 'left-[22px]' : 'left-[3px]'
          }`}
        />
      </button>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-gray-400">{loading ? '…' : desc}</p>
      </div>
    </div>
  );
};
