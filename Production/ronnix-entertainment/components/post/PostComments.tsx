/**
 * post/PostComments.tsx — Kommentar-Sektion eines Posts (Liste + Formular).
 *
 * Feature: Realtime-Kommentare (`onSnapshot`, Limit 20) inkl. Autoren-Auflösung
 * (denormalisierte Namen bevorzugt, Batch-Fallback auf `users`), Top-Level-
 * Formular (Gast → Hinweis statt Formular) und rekursive `CommentItem`-Liste.
 * Erstellen/Editieren/Löschen laufen direkt gegen Firestore (Regeln sichern
 * Rechte ab). Benutzung: `<PostComments postId currentUser isAdmin t
 * getFormattedDate />` in `pages/PostDetail.tsx`. Gehört NICHT hierher:
 * Einzelkommentar (`CommentItem.tsx`), Post-Votes/Artikel (PostDetail).
 */

import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Icon } from '../icons/Icon';
import { CommentItem } from './CommentItem';
import { logError } from '../../utils/logger';

export interface PostCommentsProps {
  postId: string;
  currentUser: any;
  isAdmin: boolean;
  t: any;
  getFormattedDate: (ts: any) => string;
}

export const PostComments: React.FC<PostCommentsProps> = ({
  postId,
  currentUser,
  isAdmin,
  t,
  getFormattedDate,
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, { name: string; photoURL: string }>>({});
  const [newComment, setNewComment] = useState('');

  // Realtime Comments (limitiert, Default 20) + denormalisierte Autoren
  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(msgs);

      // Denormalisierte Autoren bevorzugen, nur Fallback per Batch-Fetch
      const missing = [...new Set(msgs.filter((m: any) => !m.authorName && m.userId).map((m: any) => m.userId))] as string[];
      const toFetch = missing.filter(uid => uid && !(commentUsers as any)[uid]);
      if (toFetch.length) {
        try {
          const results = await Promise.all(toFetch.map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                const uData = userDoc.data() as any;
                return [uid, { name: uData.displayName || 'Hero', photoURL: uData.photoURL || '' }] as const;
              }
            } catch (e) { logError('post-comments', 'Error fetching comment user', e); }
            return [uid, { name: 'Unknown User', photoURL: '' }] as const;
          }));
          const newUsers: Record<string, { name: string, photoURL: string }> = {};
          results.forEach(([uid, info]) => { newUsers[uid] = info; });
          // Denormalisierte direkt übernehmen (kein Fetch nötig)
          msgs.forEach((m: any) => {
            if (m.authorName && !newUsers[m.userId]) {
              newUsers[m.userId] = { name: m.authorName, photoURL: m.authorPhotoURL || '' };
            }
          });
          if (Object.keys(newUsers).length > 0) {
            setCommentUsers(prev => ({ ...prev, ...newUsers }));
          }
        } catch (e) { logError('post-comments', 'comment user batch failed', e); }
      } else {
        // Nur Denormalisierte übernehmen
        const patch: Record<string, { name: string, photoURL: string }> = {};
        msgs.forEach((m: any) => {
          if (m.authorName && !(commentUsers as any)[m.userId]) {
            patch[m.userId] = { name: m.authorName, photoURL: m.authorPhotoURL || '' };
          }
        });
        if (Object.keys(patch).length) setCommentUsers(prev => ({ ...prev, ...patch }));
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null, customText?: string) => {
      if (e) e.preventDefault();
      const text = (customText || newComment).trim().slice(0, 5000);

      if (!currentUser || !text || !postId) return;
      if (!currentUser.emailVerified && currentUser.providerData?.[0]?.providerId === 'password') {
        alert('Bitte zuerst E-Mail verifizieren (Votes/Comments).');
        return;
      }

      try {
          await addDoc(collection(db, 'posts', postId, 'comments'), {
              text,
              userId: currentUser.uid,
              authorName: currentUser.displayName || 'Hero',
              authorPhotoURL: currentUser.photoURL || '',
              parentId: parentId,
              likesCount: 0,
              dislikesCount: 0,
              createdAt: serverTimestamp()
          });
          if (!parentId) setNewComment('');
      } catch (e) {
          logError('post-comments', 'Error adding comment', e);
      }
  };

  const handleEditComment = async (commentId: string, text: string) => {
      if (!postId || !text.trim()) return;
      try {
          const commentRef = doc(db, 'posts', postId, 'comments', commentId);
          await updateDoc(commentRef, {
              text: text.trim(),
              updatedAt: serverTimestamp()
          });
      } catch (e) {
          logError('post-comments', 'Error updating comment', e);
      }
  };

  const handleDeleteComment = async (commentId: string) => {
      if (!postId) return;
      if (window.confirm(t.home.common.confirmDeleteComment)) {
          await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      }
  };

  const rootComments = comments.filter(c => !c.parentId);

  return (
    <div className="bg-neutral-900/30 rounded-2xl border border-neutral-800 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-neutral-800 pb-4">
            <Icon name="message-square" className="text-red-500" size={24} />
            <h3 className="font-retro text-2xl text-white">{t.home.postDetail.commentsTitle} <span className="text-gray-500 text-lg">({comments.length})</span></h3>
        </div>

        {/* Main Comment Form */}
        {currentUser ? (
            <form onSubmit={(e) => handleSubmitComment(e, null)} className="flex gap-4 items-start mb-10">
                <div className="flex-shrink-0 hidden md:block">
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Me" loading="lazy" decoding="async" className="w-10 h-10 rounded-full object-cover border border-red-900" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-red-900 flex items-center justify-center">
                            <Icon name="user" size={20} className="text-gray-500" />
                        </div>
                    )}
                </div>
                <div className="flex-grow relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t.home.postDetail.placeholderComment}
                        className="w-full bg-black border border-neutral-700 rounded-xl p-4 pr-12 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition resize-none min-h-[100px]"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute bottom-4 right-4 bg-red-700 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t.home.postDetail.submitComment}
                    >
                        <Icon name="send" size={18} />
                    </button>
                </div>
            </form>
        ) : (
            <div className="bg-black/40 border border-neutral-800 rounded-xl p-6 text-center mb-8">
                <p className="text-gray-400 mb-4">{t.home.postDetail.loginToComment}</p>
            </div>
        )}

        {/* Comment List (Recursive) */}
        <div className="space-y-6">
            {rootComments.length > 0 ? (
                rootComments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        allComments={comments}
                        users={commentUsers}
                        currentUserId={currentUser?.uid}
                        postId={postId}
                        depth={0}
                        onReply={(text, parentId) => handleSubmitComment(null as any, parentId, text)}
                        onDelete={handleDeleteComment}
                        onEdit={handleEditComment}
                        isAdmin={isAdmin}
                        t={t}
                        getFormattedDate={getFormattedDate}
                    />
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>{t.home.postDetail.noComments}</p>
                </div>
            )}
        </div>
    </div>
  );
};
