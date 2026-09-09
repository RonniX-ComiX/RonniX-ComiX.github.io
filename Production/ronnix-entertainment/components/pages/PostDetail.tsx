/**
 * pages/PostDetail.tsx — Artikel-Seite (`/post/:id`): Hero, Meta-Karte, Votes, Share.
 *
 * Feature: lädt Post + Autor, zeigt Hero-Cover (lokales Fallback), gruppierte
 * Meta-Karte (Story/Art/Publishing: Credits getrennt, Herkunft DE vs. Original,
 * Multi-Themes), Like/Dislike (Realtime), Share (nativ + Netzwerke),
 * Admin-Toolbar (Edit/Delete) sowie SEO (Article-Typ, BreadcrumbList).
 * Kommentare leben in `post/PostComments.tsx` (+ `CommentItem.tsx`).
 * Scheduled Posts sehen nur Admins (Coming-Soon + `noIndex`).
 * Gehört NICHT hierher: Kommentar-Logik (siehe `post/`), Editor
 * (`components/RichTextEditor.tsx`, `CreatePost.tsx`).
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import { Icon } from '../icons/Icon';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getLinkUrl, postCategoryToRoute } from '../../utils/domainConfig';
import { SEO } from '../SEO'; // Import SEO
import { StructuredData } from '../StructuredData'; // Import StructuredData
import { PostComments } from '../post/PostComments'; // Kommentar-Sektion (eigene Datei)
import { CommentNotifyToggle } from '../post/CommentNotifyToggle';
import { logError, logInfo } from '../../utils/logger';
import { getExcerpt, getReadingMinutes, getThemeLabels } from '../../utils/postExcerpt';
import { hasCredits, hasOrigin, serializeCoverArtists } from '../../utils/postTypes';
import { sanitizeRender } from '../../utils/richTextSanitize';
import { COVER_FALLBACK, versionedAssetUrl } from '../../utils/appConfig';

// --- MAIN PAGE COMPONENT ---

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [authorData, setAuthorData] = useState<{name: string, photoURL: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Interactive State (Kommentare leben in `post/PostComments.tsx`)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [sanitizedHtml, setSanitizedHtml] = useState('');
  
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
                 logError('post-detail',"Could not fetch fresh author data", err);
             }
          }

        } else {
          logInfo('post-detail', "No such document!");
        }
      } catch (error) {
        logError('post-detail',"Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, isAdmin]);

  // 2. Realtime Post Vote
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

  // 3. Listen to Post Updates (for counters)
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

  // 4. Sanitized HTML für Renderer (zentrale Allowlist, YouTube-nocookie)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = post ? ((language === 'en' && post.contentEn) ? post.contentEn : post.content) : '';
      try {
        const clean = await sanitizeRender(raw || '');
        if (!cancelled) setSanitizedHtml(clean);
      } catch (e) {
        logError('post-detail', 'sanitize failed', e);
        if (!cancelled) setSanitizedHtml('');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [post, language]);

  // --- HANDLERS ---

  const handleDelete = async () => {
    if (!id || !post) return;
    if (window.confirm(t.home.common.confirmDeletePost)) {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "posts", id));
            navigate(postCategoryToRoute(post.category));
        } catch (error) {
            logError('post-detail',"Error deleting post:", error);
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
          logError('post-detail',"Voting failed", e);
      }
      setIsVoting(false);
  };

  const handleShare = async (platform: string) => {
      const url = window.location.href;
      const text = `${t.home.common.shareMessage} ${post?.title ?? ''}`;
      if (platform === 'native' && typeof navigator !== 'undefined' && (navigator as any).share) {
          try { await (navigator as any).share({ title: post?.title ?? '', text, url }); } catch {}
          return;
      }
      let shareUrl = '';
      if (platform === 'facebook') {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      } else if (platform === 'twitter') {
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      } else if (platform === 'whatsapp') {
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      } else if (platform === 'telegram') {
          shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      } else if (platform === 'copy') {
          try { await navigator.clipboard.writeText(url); } catch {}
          alert(t.home.common.linkCopied);
          return;
      }
      if (shareUrl) window.open(shareUrl, '_blank', 'noopener,width=600,height=540');
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
      // Ungeplante/scheduled Inhalte: Coming-Soon ohne Indexierung (Draft-Guard).
      return (
        <div className="container mx-auto px-6 py-12 text-center min-h-[50vh] flex flex-col justify-center items-center">
            <SEO title={post?.title || 'Coming soon'} noIndex />
            <Icon name="clock" size={64} className="text-red-500 mb-4" />
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

  const getRouteFromCategory = (cat: string) => postCategoryToRoute(cat);

  const displayAuthorName = authorData?.name || post.authorName || 'RonniX';
  const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;
  const displayContent = (language === 'en' && post.contentEn) ? post.contentEn : post.content;

  // SEO-Description: SSG-sicher, Wortgrenze (statt Regex-Strip).
  const plainTextDescription = getExcerpt(displayContent, 160);
  const readingMinutes = getReadingMinutes(displayContent);
  const themeLabels = getThemeLabels(post, t.home.admin.themes);
  const coverSrc = post.coverUrl ? post.coverUrl : versionedAssetUrl(COVER_FALLBACK);

  const credits = {
    executiveEditor: post.executiveEditor || '',
    coverArtists: Array.isArray(post.coverArtists) ? post.coverArtists : [],
    author: post.author || post.itemAuthor || '',
    artist: post.artist || '',
    inker: post.inker || '',
    colorist: post.colorist || '',
    letterer: post.letterer || '',
    editor: post.editor || '',
  };
  const origin = {
    releaseYearDe: post.releaseYearDe || post.releaseYear || '',
    releaseYearOriginal: post.releaseYearOriginal || '',
    originCountry: post.originCountry || '',
    publisherDe: post.publisherDe || post.publisher || '',
    publisherOriginal: post.publisherOriginal || '',
  };
  const showCredits = hasCredits(credits);
  const showOrigin = hasOrigin(origin);
  const coverArtistsText = serializeCoverArtists(credits.coverArtists);

  const hasMetadata = showCredits || showOrigin || post.pageCount || post.developer || post.director || post.producer || post.screenwriter || post.studio || post.seasonCount || post.episodeCount || post.productionYears || post.cast || post.runtime;

  const routePath = getRouteFromCategory(post.category);
  const backLinkObj = getLinkUrl(routePath, language);

  // Prepare Structured Data Props
  const primaryTheme = (Array.isArray(post.themes) && post.themes[0]) || post.theme || 'review';
  const schemaType = primaryTheme === 'review' ? 'Review' : 'Article';
  const publishedIso = post.publishedAt?.toDate().toISOString();
  const schemaData: any = {
      headline: displayTitle,
      description: plainTextDescription,
      image: coverSrc,
      datePublished: publishedIso,
      dateModified: post.updatedAt?.toDate().toISOString() || publishedIso,
      authorName: displayAuthorName
  };

  if (schemaType === 'Review') {
      schemaData.itemName = displayTitle;
      schemaData.itemType = post.category === 'games' ? 'Game' : post.category === 'books' ? 'Book' : 'CreativeWork';
      schemaData.itemAuthor = credits.author || post.developer || post.director || 'Unknown';
  }

  return (
    <article className="min-h-[100dvh] pb-20 animate-fade-in">
      {/* Dynamic SEO */}
      <SEO
        title={displayTitle}
        description={plainTextDescription}
        image={coverSrc}
        imageAlt={displayTitle}
        type="article"
        publishedTime={publishedIso}
      />

      {/* Structured Data JSON-LD */}
      <StructuredData type={schemaType} data={schemaData} />
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: [
            { name: 'Home', url: typeof window !== 'undefined' ? window.location.origin + '/' : undefined },
            { name: displayTitle },
          ],
        }}
      />

      {/* Hero Header */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10"></div>
        <img src={coverSrc} alt={displayTitle} fetchPriority="high" decoding="async" className="w-full h-full object-cover" onError={(e) => { if (e.currentTarget.src !== window.location.origin + versionedAssetUrl(COVER_FALLBACK)) e.currentTarget.src = versionedAssetUrl(COVER_FALLBACK); }} />
        
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
                             <Icon name="arrow-left" size={16} className="mr-2" /> {t.home.postDetail.backTo} {getCategoryName(post.category)}
                        </a>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-retro text-white leading-tight drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
                        {displayTitle}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mt-6 text-sm md:text-base text-white/90 font-medium drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                {authorData?.photoURL ? (
                                    <img src={authorData.photoURL} alt={displayAuthorName} loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-red-500 object-cover shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                ) : (
                                    <Icon name="user" size={18} className="text-red-500 drop-shadow-none" />
                                )}
                                <span className="font-bold">{displayAuthorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon name="calendar" size={18} className="text-red-500 drop-shadow-none" />
                                <span>{getFormattedDate(post.publishedAt || post.createdAt)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Icon name="tag" size={18} className="text-red-500 drop-shadow-none" />
                                {themeLabels.map((label) => (
                                  <span key={label} className="bg-red-900/60 border border-red-500/50 px-3 py-1 rounded text-red-100 uppercase text-xs font-bold tracking-wider shadow-sm">
                                    {label}
                                  </span>
                                ))}
                                {readingMinutes > 0 && (
                                  <span className="text-xs text-gray-300 font-mono">• {readingMinutes} Min.</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 md:ml-4 bg-black/60 rounded-full px-3 py-1 border border-neutral-700">
                                <Icon name="share" size={16} className="text-gray-400" />
                                <button onClick={() => handleShare('native')} title="Teilen"
           className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-white text-gray-300 transition-colors"><Icon name="share" size={18}
           /></button>
                                <button onClick={() => handleShare('facebook')} title="Facebook"
           className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-[#1877F2] text-gray-300 transition-colors"><Icon name="facebook" size={18}
           /></button>
                                <button onClick={() => handleShare('twitter')} title="X (Twitter)"
           className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-[#1DA1F2] text-gray-300 transition-colors"><Icon name="twitter" size={18}
           /></button>
                                <button onClick={() => handleShare('copy')} title="Copy Link"
           className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-green-500 text-gray-300 transition-colors"><Icon name="link" size={18}
           /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
            
            {/* ADMIN TOOLBAR */}
            {currentUser && isAdmin && (
                <div className="flex items-center justify-between bg-neutral-900/50 border border-red-900/30 rounded-lg p-4 mb-8">
                    <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider text-sm">
                        <Icon name="shield-alert" size={20} /> {t.home.postDetail.adminControls}
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            to={`/edit/${post.id}`} 
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 hover:text-white text-gray-300 px-4 py-2 rounded-lg font-bold transition border border-neutral-600 hover:border-gray-400"
                            title="Edit Post"
                        >
                            <Icon name="edit" size={16} /> <span className="hidden sm:inline">{t.home.common.edit}</span>
                        </Link>
                        <button 
                            onClick={handleDelete} 
                            disabled={isDeleting} 
                            className="flex items-center gap-2 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition border border-red-900 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Post"
                        >
                            <Icon name="trash" size={16} /> <span className="hidden sm:inline">{isDeleting ? t.home.common.deleting : t.home.common.delete}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* METADATA CARD (gruppiert: Story / Art / Publishing) */}
            {hasMetadata && (
                <div className="bg-neutral-900 border-l-4 border-red-600 p-6 rounded-r-lg shadow-lg mb-10">
                    <h3 className="text-xl font-retro text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                        <Icon name="book-open" className="text-red-500" size={20} /> {t.home.postDetail.metaHeader}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        {credits.author && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="pen-tool" size={12} /> {t.home.admin.metadata.creditAuthor}</span><span className="text-white text-lg font-medium">{credits.author}</span></div>}
                        {credits.artist && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="palette" size={12} /> {t.home.admin.metadata.creditArtist}</span><span className="text-white text-lg font-medium">{credits.artist}</span></div>}
                        {credits.inker && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="pen-tool" size={12} /> {t.home.admin.metadata.creditInker}</span><span className="text-white text-lg font-medium">{credits.inker}</span></div>}
                        {credits.colorist && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="palette" size={12} /> {t.home.admin.metadata.creditColorist}</span><span className="text-white text-lg font-medium">{credits.colorist}</span></div>}
                        {credits.letterer && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="file-text" size={12} /> {t.home.admin.metadata.creditLetterer}</span><span className="text-white text-lg font-medium">{credits.letterer}</span></div>}
                        {coverArtistsText && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="image" size={12} /> {t.home.admin.metadata.coverArtists}</span><span className="text-white text-lg font-medium">{coverArtistsText}</span></div>}
                        {credits.executiveEditor && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="shield" size={12} /> {t.home.admin.metadata.executiveEditor}</span><span className="text-white text-lg font-medium">{credits.executiveEditor}</span></div>}
                        {credits.editor && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="book-open" size={12} /> {t.home.admin.metadata.creditEditor}</span><span className="text-white text-lg font-medium">{credits.editor}</span></div>}
                        {(origin.releaseYearDe || origin.releaseYearOriginal || origin.originCountry) && (
                          <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="calendar" size={12} /> {t.home.admin.metadata.releaseYearDe} / {t.home.admin.metadata.releaseYearOriginal}</span><span className="text-white text-lg font-medium">{[origin.releaseYearDe ? `${origin.releaseYearDe} (DE)` : '', origin.releaseYearOriginal ? `${origin.releaseYearOriginal} (Original)` : '', origin.originCountry].filter(Boolean).join(' • ')}</span></div>
                        )}
                        {(origin.publisherDe || origin.publisherOriginal) && (
                          <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="briefcase" size={12} /> {t.home.admin.metadata.publisherDe} / {t.home.admin.metadata.publisherOriginal}</span><span className="text-white text-lg font-medium">{[origin.publisherDe, origin.publisherOriginal ? `(${origin.publisherOriginal})` : ''].filter(Boolean).join(' ')}</span></div>
                        )}
                        {post.developer && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="gamepad" size={12} /> {t.home.admin.metadata.developer}</span><span className="text-white text-lg font-medium">{post.developer}</span></div>}
                        {post.director && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="clapperboard" size={12} /> {t.home.admin.metadata.director}</span><span className="text-white text-lg font-medium">{post.director}</span></div>}
                        {post.producer && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="briefcase" size={12} /> {t.home.admin.metadata.producer}</span><span className="text-white text-lg font-medium">{post.producer}</span></div>}
                        {post.screenwriter && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="film" size={12} /> {t.home.admin.metadata.screenwriter}</span><span className="text-white text-lg font-medium">{post.screenwriter}</span></div>}
                        {post.studio && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="briefcase" size={12} /> {t.home.admin.metadata.studio}</span><span className="text-white text-lg font-medium">{post.studio}</span></div>}
                        {post.pageCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="layers" size={12} /> {t.home.admin.metadata.pageCount}</span><span className="text-white text-lg font-medium">{post.pageCount} {t.home.postDetail.metaPages}</span></div>}
                        {post.runtime && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="clock" size={12} /> {t.home.admin.metadata.runtime}</span><span className="text-white text-lg font-medium">{post.runtime} min</span></div>}
                        {post.seasonCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="layers" size={12} /> {t.home.admin.metadata.seasonCount}</span><span className="text-white text-lg font-medium">{post.seasonCount}</span></div>}
                        {post.episodeCount && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="tv" size={12} /> {t.home.admin.metadata.episodeCount}</span><span className="text-white text-lg font-medium">{post.episodeCount}</span></div>}
                        {post.productionYears && <div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="calendar-range" size={12} /> {t.home.admin.metadata.productionYears}</span><span className="text-white text-lg font-medium">{post.productionYears}</span></div>}
                        {post.cast && <div className="flex flex-col sm:col-span-2"><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Icon name="users" size={12} /> {t.home.admin.metadata.cast}</span><span className="text-white text-lg font-medium">{post.cast}</span></div>}
                    </div>
                </div>
            )}

            {/* Main Text Content (zentral sanitized, YouTube-nocookie, sichere Links) */}
            <div
                className="prose prose-invert prose-lg max-w-none
                prose-headings:font-retro prose-headings:text-white
                prose-h1:text-red-500 prose-h2:text-red-400
                prose-a:text-red-500 hover:prose-a:text-red-400
                prose-strong:text-white
                prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:bg-neutral-900/50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-gray-300
                prose-img:rounded-lg prose-img:border prose-img:border-neutral-800"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
            
            <div className="my-12 w-full h-px bg-neutral-800"></div>

            {/* --- INTERACTION ZONE (Votes) --- */}
            <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                <div className="flex items-center gap-8 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    {/* Like */}
                    <button 
                        onClick={() => handlePostVote('like')}
                        className={`group flex flex-col items-center gap-1 transition ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={!currentUser ? t.home.postDetail.loginToVote : 'Like'}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors duration-300 ${userVote === 'like' ? 'bg-green-900/20 border-green-500 text-green-500' : 'border-neutral-700 text-gray-500 group-hover:border-green-500 group-hover:text-green-500'}`}>
                            <Icon name="thumbs-up" size={32} />
                        </div>
                        <span className={`font-retro text-xl ${userVote === 'like' ? 'text-green-500' : 'text-gray-500'}`}>
                            {post.likesCount || 0}
                        </span>
                    </button>

                    <div className="h-12 w-px bg-neutral-700"></div>

                    {/* Dislike */}
                    <button 
                        onClick={() => handlePostVote('dislike')}
                        className={`group flex flex-col items-center gap-1 transition ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={!currentUser ? t.home.postDetail.loginToVote : 'Dislike'}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors duration-300 ${userVote === 'dislike' ? 'bg-red-900/20 border-red-600 text-red-600' : 'border-neutral-700 text-gray-500 group-hover:border-red-600 group-hover:text-red-600'}`}>
                            <Icon name="thumbs-down" size={32} />
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


            {/* --- COMMENTS SECTION (State + Logik in `post/PostComments.tsx`) --- */}
            <CommentNotifyToggle postId={id || ''} currentUser={currentUser} t={t} />
            <PostComments
                postId={id || ''}
                currentUser={currentUser}
                isAdmin={isAdmin}
                t={t}
                getFormattedDate={getFormattedDate}
            />

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
