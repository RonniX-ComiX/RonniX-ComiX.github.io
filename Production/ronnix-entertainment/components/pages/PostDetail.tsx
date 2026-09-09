

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { 
  ArrowLeft, Calendar, User, Edit, Trash2, Tag, Clock, 
  ThumbsUp, ThumbsDown, MessageSquare, Share2, 
  Facebook, Twitter, Link as LinkIcon, Send, ShieldAlert,
  BookOpen, Layers, PenTool, Briefcase, Gamepad2, Clapperboard, Users, Film, Tv, CalendarRange, X, Check,
  CornerDownRight, Reply
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getLinkUrl } from '../../utils/domainConfig';
import { SEO } from '../SEO'; // Import SEO
import { StructuredData } from '../StructuredData'; // Import StructuredData

// --- HELPER COMPONENT: Single Comment Item (Recursive) ---
const CommentItem: React.FC<{
    comment: any;
    allComments: any[];
    users: Record<string, { name: string, photoURL: string }>;
    currentUserId?: string;
    postId: string;
    depth: number;
    onReply: (text: string, parentId: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
    isAdmin: boolean;
    t: any;
    getFormattedDate: (ts: any) => string;
}> = ({ comment, allComments, users, currentUserId, postId, depth, onReply, onDelete, onEdit, isAdmin, t, getFormattedDate }) => {
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
            console.error("Comment vote failed", e);
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
                        <img src={userInfo.photoURL} alt={userInfo.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-neutral-700" />
                    ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                            <User size={18} className="text-gray-500" />
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
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(comment.id)} className="text-neutral-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
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
                                        <X size={12} /> {t.home.common.cancel}
                                    </button>
                                    <button onClick={submitEdit} className="flex items-center gap-1 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">
                                        <Check size={12} /> {t.home.common.save}
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
                                className={`p-1.5 transition-colors ${userVote === 'like' ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                             >
                                <ThumbsUp size={14} fill={userVote === 'like' ? "currentColor" : "none"} />
                             </button>
                             <span className={`text-xs font-mono w-4 text-center ${userVote === 'like' ? 'text-green-500' : userVote === 'dislike' ? 'text-red-500' : 'text-gray-500'}`}>
                                {(comment.likesCount || 0) - (comment.dislikesCount || 0)}
                             </span>
                             <button 
                                onClick={() => handleVote('dislike')}
                                disabled={!currentUserId}
                                className={`p-1.5 transition-colors ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                             >
                                <ThumbsDown size={14} fill={userVote === 'dislike' ? "currentColor" : "none"} />
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
                                <Reply size={14} /> Reply
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                        <form onSubmit={submitReply} className="mt-3 flex gap-3 animate-fade-in">
                            <div className="flex items-center justify-center w-8 text-gray-600">
                                <CornerDownRight size={20} />
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
                                    <Send size={16} />
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

// --- MAIN PAGE COMPONENT ---

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [authorData, setAuthorData] = useState<{name: string, photoURL: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Interactive State
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, { name: string, photoURL: string }>>({});
  const [newComment, setNewComment] = useState('');

  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  
  const { t, language } = useLanguage(); 
  const { currentUser, isAdmin } = useAuth();

  // 1. Fetch Post Data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({ id: docSnap.id, ...data });

          // Fetch Dynamic Author Data
          if (data.authorId) {
             try {
                 const userDocRef = doc(db, 'users', data.authorId);
                 const userDocSnap = await getDoc(userDocRef);
                 if (userDocSnap.exists()) {
                     const userData = userDocSnap.data();
                     setAuthorData({
                         name: userData.displayName || data.authorName,
                         photoURL: userData.photoURL
                     });
                 }
             } catch (err) {
                 console.error("Could not fetch fresh author data", err);
             }
          }

        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, isAdmin]);

  // 2. Realtime Comments (limitiert via Remote Config pageSize, Default 20) + denormalisierte Autoren
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(msgs);

      // Denormalisierte Autoren bevorzugen (onCommentCreated), nur Fallback per Batch-Fetch
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
            } catch (e) { console.error("Error fetching comment user", e); }
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
        } catch (e) { console.error("comment user batch failed", e); }
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
  }, [id]);

  // 3. Realtime Post Vote
  useEffect(() => {
    if (!id || !currentUser) {
        setUserVote(null);
        return;
    }
    const voteRef = doc(db, 'posts', id, 'votes', currentUser.uid);
    const unsubscribe = onSnapshot(voteRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setUserVote(data.value === 1 ? 'like' : 'dislike');
        } else {
            setUserVote(null);
        }
    });
    return () => unsubscribe();
  }, [id, currentUser]);

  // 4. Listen to Post Updates (for counters)
  useEffect(() => {
      if (!id) return;
      const postRef = doc(db, 'posts', id);
      const unsubscribe = onSnapshot(postRef, (doc) => {
          if (doc.exists()) {
              const data = doc.data();
              setPost((prev: any) => ({
                  ...prev,
                  likesCount: data.likesCount || 0,
                  dislikesCount: data.dislikesCount || 0
              }));
          }
      });
      return () => unsubscribe();
  }, [id]);

  // --- HANDLERS ---

  const handleDelete = async () => {
    if (!id || !post) return;
    if (window.confirm(t.home.common.confirmDeletePost)) {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "posts", id));
            navigate(`/${post.category}`);
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Fehler beim Löschen des Beitrags.");
            setIsDeleting(false);
        }
    }
  };

  const handlePostVote = async (type: 'like' | 'dislike') => {
      if (!currentUser || !id || isVoting) return;
      if (!currentUser.emailVerified && currentUser.providerData?.[0]?.providerId === 'password') {
        alert('Bitte zuerst E-Mail verifizieren (Votes/Comments).');
        return;
      }
      setIsVoting(true);
      try {
          const votePost = httpsCallable(functions, 'votePost');
          await votePost({ postId: id, value: type });
      } catch (e) {
          console.error("Voting failed", e);
      }
      setIsVoting(false);
  };

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null, customText?: string) => {
      if (e) e.preventDefault();
      const text = (customText || newComment).trim().slice(0, 5000);

      if (!currentUser || !text || !id) return;
      if (!currentUser.emailVerified && currentUser.providerData?.[0]?.providerId === 'password') {
        alert('Bitte zuerst E-Mail verifizieren (Votes/Comments).');
        return;
      }

      try {
          await addDoc(collection(db, 'posts', id, 'comments'), {
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
          console.error("Error adding comment", e);
      }
  };

  const handleEditComment = async (commentId: string, text: string) => {
      if (!id || !text.trim()) return;
      try {
          const commentRef = doc(db, 'posts', id, 'comments', commentId);
          await updateDoc(commentRef, {
              text: text.trim(),
              updatedAt: serverTimestamp()
          });
      } catch (e) {
          console.error("Error updating comment", e);
      }
  };

  const handleDeleteComment = async (commentId: string) => {
      if (!id) return;
      if (window.confirm(t.home.common.confirmDeleteComment)) {
          await deleteDoc(doc(db, 'posts', id, 'comments', commentId));
      }
  };

  const handleShare = (platform: string) => {
      const url = window.location.href;
      const text = `${t.home.common.shareMessage} ${post.title}`;
      let shareUrl = '';
      if (platform === 'facebook') {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      } else if (platform === 'twitter') {
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      } else if (platform === 'copy') {
          navigator.clipboard.writeText(url);
          alert(t.home.common.linkCopied);
          return;
      }
      if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isScheduled = post?.publishedAt?.seconds > Timestamp.now().seconds;
  if (isScheduled && !isAdmin) {
      return (
        <div className="container mx-auto px-6 py-12 text-center min-h-[50vh] flex flex-col justify-center items-center">
            <Clock size={64} className="text-red-500 mb-4" />
            <h2 className="text-3xl font-retro text-white mb-2">{t.home.postDetail.comingSoon}</h2>
            <p className="text-gray-400 mb-6">{t.home.postDetail.scheduledMessage}</p>
            <Link to="/" className="text-red-500 hover:underline">{t.home.common.goHome}</Link>
        </div>
      );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-3xl font-retro text-gray-500">{t.home.postDetail.notFound}</h2>
        <Link to="/" className="text-red-500 hover:underline mt-4 inline-block">{t.home.common.goHome}</Link>
      </div>
    );
  }

  const getFormattedDate = (timestamp: any) => {
      if (!timestamp?.toDate) return t.home.postDetail.unknownDate;
      const dateObj = timestamp.toDate();
      const locale = language === 'de' ? 'de-DE' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(dateObj) + (language === 'de' ? ' Uhr' : '');
  };

  const getCategoryName = (cat: string) => {
      if (cat === 'comics') return t.home.comics.title;
      if (cat === 'books') return t.home.books.title;
      if (cat === 'games') return t.home.games.title;
      if (cat === 'movies') return t.home.movies.title;
      if (cat === 'series') return t.home.series.title;
      return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const getRouteFromCategory = (cat: string) => {
      switch(cat) {
          case 'books': return '/boox';
          case 'games': return '/gamez';
          case 'movies': return '/moviez';
          case 'series': return '/seriez';
          default: return `/${cat}`;
      }
  }

  const getThemeName = (th: string) => {
      return t.home.admin.themes[th as keyof typeof t.home.admin.themes] || th || 'Review';
  }

  const displayAuthorName = authorData?.name || post.authorName || 'RonniX';
  const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;
  const displayContent = (language === 'en' && post.contentEn) ? post.contentEn : post.content;
  
  // Strip HTML for SEO description
  const plainTextDescription = displayContent.replace(/<[^>]+>/g, '').substring(0, 160) + '...';

  const hasMetadata = post.itemAuthor || post.publisher || post.pageCount || post.releaseYear || post.developer || post.director || post.studio || post.seasonCount || post.episodeCount || post.productionYears;

  const routePath = getRouteFromCategory(post.category);
  const backLinkObj = getLinkUrl(routePath, language);

  // Filter root comments for the main list
  const rootComments = comments.filter(c => !c.parentId);
  
  // Prepare Structured Data Props
  const schemaType = post.theme === 'review' ? 'Review' : 'Article';
  const schemaData: any = {
      headline: displayTitle,
      description: plainTextDescription,
      image: post.coverUrl,
      datePublished: post.publishedAt?.toDate().toISOString(),
      authorName: displayAuthorName
  };

  if (schemaType === 'Review') {
      schemaData.itemName = displayTitle;
      schemaData.itemType = post.category === 'games' ? 'Game' : post.category === 'books' ? 'Book' : 'CreativeWork';
      schemaData.itemAuthor = post.itemAuthor || post.developer || post.director || 'Unknown';
  }

  return (
    <article className="min-h-screen pb-20 animate-fade-in">
      {/* Dynamic SEO */}
      <SEO 
        title={displayTitle} 
        description={plainTextDescription}
        image={post.coverUrl}
        type="article"
      />
      
      {/* Structured Data JSON-LD */}
      <StructuredData type={schemaType} data={schemaData} />

      {/* Hero Header */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10"></div>
        <img src={post.coverUrl} alt={displayTitle} className="w-full h-full object-cover" />
        
        {isScheduled && (
            <div className="absolute top-0 left-0 w-full bg-yellow-600/90 text-black text-center py-2 font-bold uppercase tracking-widest z-30">
                ⚠️ {t.home.postDetail.scheduledBadge} - {t.home.postDetail.adminView}
            </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 w-full z-20">
            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-5xl mx-auto pb-6 md:pb-12">
                    <div className="flex justify-between items-end">
                        <a href={backLinkObj.isExternal ? backLinkObj.url : '#'} onClick={(e) => { if(!backLinkObj.isExternal) { e.preventDefault(); navigate(backLinkObj.url) }}} className="inline-flex items-center text-white/90 hover:text-red-500 mb-4 transition-colors font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                             <ArrowLeft size={16} className="mr-2" /> {t.home.postDetail.backTo} {getCategoryName(post.category)}
                        </a>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-retro text-white leading-tight drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
                        {displayTitle}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mt-6 text-sm md:text-base text-white/90 font-medium drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                {authorData?.photoURL ? (
                                    <img src={authorData.photoURL} alt={displayAuthorName} className="w-8 h-8 rounded-full border border-red-500 object-cover shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                ) : (
                                    <User size={18} className="text-red-500 drop-shadow-none" />
                                )}
                                <span className="font-bold">{displayAuthorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-red-500 drop-shadow-none" />
                                <span>{getFormattedDate(post.publishedAt || post.createdAt)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Tag size={18} className="text-red-500 drop-shadow-none" />
                                <span className="bg-red-900/40 border border-red-500/50 backdrop-blur-sm px-3 py-1 rounded text-red-100 uppercase text-xs font-bold tracking-wider shadow-sm">
                                    {getThemeName(post.theme)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 md:ml-4 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 border border-neutral-700">
                                <Share2 size={16} className="text-gray-400" />
                                <button onClick={() => handleShare('facebook')} title="Facebook" className="p-1.5 hover:text-[#1877F2] text-gray-300 transition-colors"><Facebook size={18} /></button>
                                <button onClick={() => handleShare('twitter')} title="X (Twitter)" className="p-1.5 hover:text-[#1DA1F2] text-gray-300 transition-colors"><Twitter size={18} /></button>
                                <button onClick={() => handleShare('copy')} title="Copy Link" className="p-1.5 hover:text-green-500 text-gray-300 transition-colors"><LinkIcon size={18} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="max-w-5xl mx-auto">
            
            {/* ADMIN TOOLBAR */}
            {currentUser && isAdmin && (
                <div className="flex items-center justify-between bg-neutral-900/50 border border-red-900/30 rounded-lg p-4 mb-8">
                    <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider text-sm">
                        <ShieldAlert size={20} /> {t.home.postDetail.adminControls}
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            to={`/edit/${post.id}`} 
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 hover:text-white text-gray-300 px-4 py-2 rounded-lg font-bold transition-all border border-neutral-600 hover:border-gray-400"
                            title="Edit Post"
                        >
                            <Edit size={16} /> <span className="hidden sm:inline">{t.home.common.edit}</span>
                        </Link>
                        <button 
                            onClick={handleDelete} 
                            disabled={isDeleting} 
                            className="flex items-center gap-2 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-all border border-red-900 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Post"
                        >
                            <Trash2 size={16} /> <span className="hidden sm:inline">{isDeleting ? t.home.common.deleting : t.home.common.delete}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* METADATA CARD */}
            {hasMetadata && (
                <div className="bg-neutral-900 border-l-4 border-red-600 p-6 rounded-r-lg shadow-lg mb-10">
                    <h3 className="text-xl font-retro text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                        <BookOpen className="text-red-500" size={20} /> {t.home.postDetail.metaHeader}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        {post.itemAuthor && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><PenTool size={12} /> {t.home.admin.metadata.itemAuthor}</span><span className="text-white text-lg font-medium">{post.itemAuthor}</span></div>}
                        {post.developer && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Gamepad2 size={12} /> {t.home.admin.metadata.developer}</span><span className="text-white text-lg font-medium">{post.developer}</span></div>}
                        {post.director && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Clapperboard size={12} /> {t.home.admin.metadata.director}</span><span className="text-white text-lg font-medium">{post.director}</span></div>}
                        {post.producer && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Briefcase size={12} /> {t.home.admin.metadata.producer}</span><span className="text-white text-lg font-medium">{post.producer}</span></div>}
                        {post.screenwriter && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Film size={12} /> {t.home.admin.metadata.screenwriter}</span><span className="text-white text-lg font-medium">{post.screenwriter}</span></div>}
                        {post.publisher && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Briefcase size={12} /> {t.home.admin.metadata.publisher}</span><span className="text-white text-lg font-medium">{post.publisher}</span></div>}
                        {post.studio && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Briefcase size={12} /> {t.home.admin.metadata.studio}</span><span className="text-white text-lg font-medium">{post.studio}</span></div>}
                        {post.pageCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Layers size={12} /> {t.home.admin.metadata.pageCount}</span><span className="text-white text-lg font-medium">{post.pageCount} {t.home.postDetail.metaPages}</span></div>}
                        {(post.releaseYear || post.runtime) && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Calendar size={12} /> {t.home.admin.metadata.releaseYear} / {t.home.admin.metadata.runtime}</span><span className="text-white text-lg font-medium">{post.releaseYear || ''}{post.releaseYear && post.runtime ? ' • ' : ''}{post.runtime ? `${post.runtime} min` : ''}</span></div>}
                        {post.seasonCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Layers size={12} /> {t.home.admin.metadata.seasonCount}</span><span className="text-white text-lg font-medium">{post.seasonCount}</span></div>}
                        {post.episodeCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Tv size={12} /> {t.home.admin.metadata.episodeCount}</span><span className="text-white text-lg font-medium">{post.episodeCount}</span></div>}
                        {post.productionYears && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><CalendarRange size={12} /> {t.home.admin.metadata.productionYears}</span><span className="text-white text-lg font-medium">{post.productionYears}</span></div>}
                        {post.cast && <div className="flex flex-col sm:col-span-2"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Users size={12} /> {t.home.admin.metadata.cast}</span><span className="text-white text-lg font-medium">{post.cast}</span></div>}
                    </div>
                </div>
            )}

            {/* Main Text Content (DOMPurify gegen XSS aus RichTextEditor-HTML) */}
            <div
                className="prose prose-invert prose-lg max-w-none
                prose-headings:font-retro prose-headings:text-white
                prose-h1:text-red-500 prose-h2:text-red-400
                prose-a:text-red-500 hover:prose-a:text-red-400
                prose-strong:text-white
                prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:bg-neutral-900/50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-gray-300
                prose-img:rounded-lg prose-img:border prose-img:border-neutral-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayContent || '', { ADD_ATTR: ['target', 'rel'] }) }}
            />
            
            <div className="my-12 w-full h-px bg-neutral-800"></div>

            {/* --- INTERACTION ZONE (Votes) --- */}
            <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                <div className="flex items-center gap-8 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    {/* Like */}
                    <button 
                        onClick={() => handlePostVote('like')}
                        className={`group flex flex-col items-center gap-1 transition-all ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={!currentUser ? t.home.postDetail.loginToVote : 'Like'}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors duration-300 ${userVote === 'like' ? 'bg-green-900/20 border-green-500 text-green-500' : 'border-neutral-700 text-gray-500 group-hover:border-green-500 group-hover:text-green-500'}`}>
                            <ThumbsUp size={32} fill={userVote === 'like' ? "currentColor" : "none"} />
                        </div>
                        <span className={`font-retro text-xl ${userVote === 'like' ? 'text-green-500' : 'text-gray-500'}`}>
                            {post.likesCount || 0}
                        </span>
                    </button>

                    <div className="h-12 w-px bg-neutral-700"></div>

                    {/* Dislike */}
                    <button 
                        onClick={() => handlePostVote('dislike')}
                        className={`group flex flex-col items-center gap-1 transition-all ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={!currentUser ? t.home.postDetail.loginToVote : 'Dislike'}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors duration-300 ${userVote === 'dislike' ? 'bg-red-900/20 border-red-600 text-red-600' : 'border-neutral-700 text-gray-500 group-hover:border-red-600 group-hover:text-red-600'}`}>
                            <ThumbsDown size={32} fill={userVote === 'dislike' ? "currentColor" : "none"} />
                        </div>
                        <span className={`font-retro text-xl ${userVote === 'dislike' ? 'text-red-600' : 'text-gray-500'}`}>
                            {post.dislikesCount || 0}
                        </span>
                    </button>
                </div>
                {!currentUser && (
                    <p className="text-sm text-gray-500 italic">{t.home.postDetail.loginToVote}</p>
                )}
            </div>


            {/* --- COMMENTS SECTION --- */}
            <div className="bg-neutral-900/30 rounded-2xl border border-neutral-800 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-neutral-800 pb-4">
                    <MessageSquare className="text-red-500" size={24} />
                    <h3 className="font-retro text-2xl text-white">{t.home.postDetail.commentsTitle} <span className="text-gray-500 text-lg">({comments.length})</span></h3>
                </div>

                {/* Main Comment Form */}
                {currentUser ? (
                    <form onSubmit={(e) => handleSubmitComment(e, null)} className="flex gap-4 items-start mb-10">
                        <div className="flex-shrink-0 hidden md:block">
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="Me" className="w-10 h-10 rounded-full object-cover border border-red-900" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-red-900 flex items-center justify-center">
                                    <User size={20} className="text-gray-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow relative">
                            <textarea 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={t.home.postDetail.placeholderComment}
                                className="w-full bg-black border border-neutral-700 rounded-xl p-4 pr-12 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none min-h-[100px]"
                            />
                            <button 
                                type="submit" 
                                disabled={!newComment.trim()}
                                className="absolute bottom-4 right-4 bg-red-700 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t.home.postDetail.submitComment}
                            >
                                <Send size={18} />
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
                                postId={id || ''}
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

            <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
                    <p className="font-retro text-2xl text-gray-500">RonniX <span className="text-red-600">Entertainment</span></p>
                    <div className="flex gap-4">
                        <button 
                        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                        {t.home.postDetail.scrollToTop} ↑
                        </button>
                    </div>
            </div>
        </div>
      </div>
    </article>
  );
};
