/**
 * post/CommentItem.tsx — Einzelkommentar mit Antworten, Votes und Edit (rekursiv).
 *
 * Feature: rendert einen Kommentar (Avatar, Name, Datum, Edit-Badge),
 * Owner/Admin-Controls (Edit/Delete), Like/Dislike per Realtime-Vote,
 * Reply-Form (Tiefe < 3, Gast → disabled statt unmounted = kein Layout-Sprung)
 * und rendert Antworten rekursiv. Benutzung: in `PostComments.tsx` je
 * Root-Kommentar. Gehört NICHT hierher: Kommentar-Liste/Formular
 * (`PostComments.tsx`), Post-Artikel (`pages/PostDetail.tsx`).
 */

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Icon } from '../icons/Icon';
import { logError } from '../../utils/logger';

export interface CommentItemProps {
  comment: any;
  allComments: any[];
  users: Record<string, { name: string; photoURL: string }>;
  currentUserId?: string;
  postId: string;
  depth: number;
  onReply: (text: string, parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isAdmin: boolean;
  t: any;
  getFormattedDate: (ts: any) => string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  allComments,
  users,
  currentUserId,
  postId,
  depth,
  onReply,
  onDelete,
  onEdit,
  isAdmin,
  t,
  getFormattedDate,
}) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    // Filter replies for this comment
    const replies = allComments.filter(c => c.parentId === comment.id);
    const userInfo = users[comment.userId] || (comment.authorName ? { name: comment.authorName, photoURL: comment.authorPhotoURL || '' } : { name: '...', photoURL: '' });
    const isOwner = currentUserId === comment.userId;

    // Realtime Vote Listener for this specific comment/user
    useEffect(() => {
        if (!currentUserId || !comment.id) return;
        const voteRef = doc(db, 'posts', postId, 'comments', comment.id, 'votes', currentUserId);
        const unsubscribe = onSnapshot(voteRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserVote(docSnap.data().value === 1 ? 'like' : 'dislike');
            } else {
                setUserVote(null);
            }
        });
        return () => unsubscribe();
    }, [postId, comment.id, currentUserId]);

    const handleVote = async (type: 'like' | 'dislike') => {
        if (!currentUserId || isVoting) return;
        setIsVoting(true);
        try {
            const voteComment = httpsCallable(functions, 'voteComment');
            await voteComment({ postId, commentId: comment.id, value: type });
        } catch (e) {
            logError('comment-item', 'Comment vote failed', e);
        }
        setIsVoting(false);
    };

    const submitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onReply(replyText, comment.id);
            setIsReplying(false);
            setReplyText('');
        }
    };

    const submitEdit = () => {
        if (editText.trim()) {
            onEdit(comment.id, editText);
            setIsEditing(false);
        }
    };

    return (
        <div className={`flex flex-col ${depth > 0 ? 'mt-4' : 'mt-6'}`}>
            <div className="flex gap-3 md:gap-4 group">
                <div className="flex-shrink-0">
                    {userInfo.photoURL ? (
                        <img src={userInfo.photoURL} alt={userInfo.name} loading="lazy" decoding="async" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-neutral-700" />
                    ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                            <Icon name="user" size={18} className="text-gray-500" />
                        </div>
                    )}
                </div>

                <div className="flex-grow min-w-0">
                    <div className="bg-neutral-800 rounded-2xl rounded-tl-none p-3 md:p-4 relative border border-neutral-700">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-wrap items-center gap-x-2">
                                <span className="font-bold text-red-500 text-sm md:text-base">{userInfo.name}</span>
                                <span className="text-[10px] md:text-xs text-gray-500">{getFormattedDate(comment.createdAt)}</span>
                                {comment.updatedAt && (
                                    <span className="text-[10px] text-neutral-600 italic">({t.home.common.edit})</span>
                                )}
                            </div>

                            {/* Admin/Owner Controls */}
                            {(isAdmin || isOwner) && !isEditing && (
                                <div className="flex gap-2">
                                    {isOwner && (
                                        <button onClick={() => setIsEditing(true)} className="text-neutral-500 hover:text-white transition-colors">
                                            <Icon name="edit" size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(comment.id)} className="text-neutral-500 hover:text-red-500 transition-colors">
                                        <Icon name="trash" size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full bg-black border border-neutral-600 rounded p-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none min-h-[60px]"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded">
                                        <Icon name="x" size={12} /> {t.home.common.cancel}
                                    </button>
                                    <button onClick={submitEdit} className="flex items-center gap-1 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">
                                        <Icon name="check" size={12} /> {t.home.common.save}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base break-words">{comment.text}</p>
                        )}
                    </div>

                    {/* Footer Actions (Vote & Reply) */}
                    <div className="flex items-center gap-4 mt-2 ml-1">
                        <div className="flex items-center bg-neutral-900/50 rounded-full px-2 py-0.5 border border-neutral-800">
                             <button
                                onClick={() => handleVote('like')}
                                disabled={!currentUserId}
                                className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${userVote === 'like' ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                             >
                                <Icon name="thumbs-up" size={14} />
                             </button>
                             <span className={`text-xs font-mono w-4 text-center ${userVote === 'like' ? 'text-green-500' : userVote === 'dislike' ? 'text-red-500' : 'text-gray-500'}`}>
                                {(comment.likesCount || 0) - (comment.dislikesCount || 0)}
                             </span>
                             <button
                                onClick={() => handleVote('dislike')}
                                disabled={!currentUserId}
                                className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                             >
                                <Icon name="thumbs-down" size={14} />
                             </button>
                        </div>

                        {/* Reply: immer gemountet (kein Layout-Sprung bei Silent-Login), ohne Session disabled */}
                        {depth < 3 && (
                            <button
                                onClick={() => currentUserId && setIsReplying(!isReplying)}
                                disabled={!currentUserId}
                                aria-disabled={!currentUserId}
                                title={currentUserId ? undefined : 'Login zum Antworten'}
                                className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${isReplying ? 'text-white' : 'text-gray-500 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                <Icon name="reply" size={14} /> Reply
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                        <form onSubmit={submitReply} className="mt-3 flex gap-3 animate-fade-in">
                            <div className="flex items-center justify-center w-8 text-gray-600">
                                <Icon name="corner-down-right" size={20} />
                            </div>
                            <div className="flex-grow flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    autoFocus
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Antwort schreiben..."
                                    className="flex-grow bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-600 focus:outline-none"
                                />
                                <button type="submit" className="bg-red-700 hover:bg-red-600 text-white p-2 rounded-lg">
                                    <Icon name="send" size={16} />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Recursion for Replies */}
            {replies.length > 0 && (
                <div className="pl-6 md:pl-10 border-l-2 border-neutral-800 ml-4 md:ml-5">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            allComments={allComments}
                            users={users}
                            currentUserId={currentUserId}
                            postId={postId}
                            depth={depth + 1}
                            onReply={onReply}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isAdmin={isAdmin}
                            t={t}
                            getFormattedDate={getFormattedDate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
