
/**
 * pages/CreatePost.tsx — Beitrag erstellen/bearbeiten (`/create`, `/edit/:id`).
 *
 * Feature: zweisprachige Tabs (DE/EN: Titel + `RichTextEditor`), Cover-Upload
 * und Metadaten via `post/PostMetaFields`, Slug-Vorschau, Publish-Datum,
 * Speichern als Draft/Scheduled (Firestore + Storage-Regeln sichern Rechte).
 * Benutzung: nur Admins (Guard mit Early-Return; Fetch-Effekt oberhalb).
 * Gehört NICHT hierher: Editor-UI (`RichTextEditor.tsx`, `editor/`),
 * Meta-Felder (`post/PostMetaFields.tsx`), Artikel-Ansicht (`PostDetail.tsx`).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { SectionTitle } from '../SectionTitle';
import { RichTextEditor } from '../RichTextEditor';
import { PostMetaFields } from '../post/PostMetaFields';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../icons/Icon';
import { logError } from '../../utils/logger';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID if in edit mode
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'de' | 'en'>('de');

  // German (Default) State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // English State
  const [titleEn, setTitleEn] = useState('');
  const [contentEn, setContentEn] = useState('');

  // Common Metadata
  const [coverUrl, setCoverUrl] = useState('');
  const [category, setCategory] = useState('comics');
  const [theme, setTheme] = useState('review'); // Default theme
  const [scheduledDate, setScheduledDate] = useState('');

  // Extended Metadata (Comics/Books/Games/Movies/Series)
  const [itemAuthor, setItemAuthor] = useState(''); // The author of the book/comic
  const [publisher, setPublisher] = useState(''); // Publisher for Books/Comics/Games
  const [developer, setDeveloper] = useState(''); // For games
  const [pageCount, setPageCount] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  
  // Movie & Series Specific Metadata
  const [director, setDirector] = useState('');
  const [producer, setProducer] = useState('');
  const [screenwriter, setScreenwriter] = useState('');
  const [studio, setStudio] = useState('');
  const [cast, setCast] = useState('');
  const [runtime, setRuntime] = useState(''); // Used for average duration in Series too

  // Series Specific
  const [seasonCount, setSeasonCount] = useState('');
  const [episodeCount, setEpisodeCount] = useState('');
  const [productionYears, setProductionYears] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id); // Loading state for fetching edit data
  const [error, setError] = useState('');

  // Fetch data if editing (oberhalb des Early-Returns: stabile Hooks-Reihenfolge;
  // `isAdmin`-Guard im Effekt erhält das alte Verhalten — kein Fetch für Gäste).
  useEffect(() => {
    if (id && isAdmin) {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, 'posts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as any;

                    // Load German (Standard)
                    setTitle(data.title || '');
                    setContent(data.content || '');

                    // Load English
                    setTitleEn(data.titleEn || '');
                    setContentEn(data.contentEn || '');

                    // Metadata
                    setCoverUrl(data.coverUrl);
                    setCategory(data.category);
                    setTheme(data.theme || 'review');

                    // Extended Metadata
                    setItemAuthor(data.itemAuthor || '');
                    setPublisher(data.publisher || '');
                    setDeveloper(data.developer || '');
                    setPageCount(data.pageCount || '');
                    setReleaseYear(data.releaseYear || '');

                    // Movie & Series Metadata
                    setDirector(data.director || '');
                    setProducer(data.producer || '');
                    setScreenwriter(data.screenwriter || '');
                    setStudio(data.studio || '');
                    setCast(data.cast || '');
                    setRuntime(data.runtime || '');

                    // Series Specific
                    setSeasonCount(data.seasonCount || '');
                    setEpisodeCount(data.episodeCount || '');
                    setProductionYears(data.productionYears || '');

                    // Format timestamp for datetime-local input (YYYY-MM-DDThh:mm)
                    if (data.publishedAt) {
                        const date = data.publishedAt.toDate();
                        const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                            .toISOString()
                            .slice(0, 16);
                        setScheduledDate(isoString);
                    }
                } else {
                    setError(t.home.admin.errorDoc404);
                }
            } catch (err) {
                logError('create-post',"Error fetching doc:", err);
                setError(t.home.admin.errorLoad);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }
  }, [id, isAdmin, t.home.admin.errorDoc404, t.home.admin.errorLoad]);

  // Strict Access Control
  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="inline-block p-6 border-2 border-red-600 rounded-lg bg-black">
            <Icon name="alert-triangle" className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-retro text-white mb-2">{t.home.common.accessDenied}</h2>
            <p className="text-gray-400">{t.home.common.adminOnly}</p>
        </div>
      </div>
    );
  }

  // Helper to generate URL-safe slug
  const generateSlug = (text: string) => {
    // Determine the date prefix (Scheduled date or Today)
    let datePrefix = new Date().toISOString().split('T')[0]; // Default to today
    
    if (scheduledDate) {
        // scheduledDate format is YYYY-MM-DDThh:mm
        datePrefix = scheduledDate.split('T')[0];
    }

    const textSlug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    return `${datePrefix}-${textSlug}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        setError(t.home.admin.errorMissing);
        return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Calculate publish date
      let publishedAt = serverTimestamp();
      if (scheduledDate) {
          publishedAt = Timestamp.fromDate(new Date(scheduledDate));
      }

      // Base Data object
      const postData = {
          title,
          content,
          titleEn: titleEn || '', // Optional
          contentEn: contentEn || '', // Optional
          coverUrl: coverUrl || 'https://placehold.co/600x400/1a1a1a/dc2626?text=No+Cover',
          category,
          theme,
          // Extended Metadata
          itemAuthor,
          publisher,
          developer,
          pageCount,
          releaseYear,
          // Movie & Series Metadata
          director,
          producer,
          screenwriter,
          studio,
          cast,
          runtime,
          // Series Specific
          seasonCount,
          episodeCount,
          productionYears,
          publishedAt: publishedAt,
          updatedAt: serverTimestamp(),
      };

      if (id) {
        // UPDATE Existing Post (Do not change ID/Slug)
        const docRef = doc(db, 'posts', id);
        await updateDoc(docRef, postData);
      } else {
        // CREATE New Post with Custom Slug
        const slug = generateSlug(title);
        
        // Add creation metadata
        const newPostData = {
            ...postData,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'RonniX',
            createdAt: serverTimestamp(),
        };

        const docRef = doc(db, 'posts', slug);
        await setDoc(docRef, newPostData);
      }
      
      navigate(`/${category}`);
    } catch (err: any) {
      logError('create-post',"Error saving document: ", err);
      if (err.code === 'permission-denied') {
        setError(t.home.admin.errorPermission);
      } else {
        setError(t.home.admin.errorSave);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[100dvh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      );
  }

  const generatedSlugPreview = title ? generateSlug(title) : '...';
  const labelClass = "block text-lg font-bold text-white mb-2 font-sans";

  return (
    <div className="container mx-auto px-6 py-12 min-h-[100dvh]">
       <div className="max-w-4xl mx-auto">
         <SectionTitle title={id ? t.home.admin.editTitle : t.home.admin.createTitle} />
         
         <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {error && (
                <div className="bg-red-900/20 border border-red-600 text-red-200 p-4 rounded mb-6 flex items-center gap-3">
                    <Icon name="alert-triangle" size={24} />
                    {error}
                </div>
            )}

            {/* Language Tabs */}
            <div className="flex space-x-2 border-b border-neutral-800 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab('de')}
                    className={`px-6 py-3 font-bold font-retro tracking-wide transition rounded-t-lg flex items-center gap-2 ${
                        activeTab === 'de' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-neutral-900 text-gray-400 hover:text-white hover:bg-neutral-800'
                    }`}
                >
                    <Icon name="globe" size={16} /> {t.home.admin.languageTabs.de}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={`px-6 py-3 font-bold font-retro tracking-wide transition rounded-t-lg flex items-center gap-2 ${
                        activeTab === 'en' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-900 text-gray-400 hover:text-white hover:bg-neutral-800'
                    }`}
                >
                    <Icon name="globe" size={16} /> {t.home.admin.languageTabs.en}
                </button>
            </div>

            {/* CONTENT AREA: DEUTSCH */}
            <div style={{ display: activeTab === 'de' ? 'block' : 'none' }} className="animate-fade-in">
                <div className="mb-6">
                    <label className={labelClass} htmlFor="post-title-de">
                        {t.home.admin.titleLabel} (DE)
                    </label>
                    <input
                        id="post-title-de"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white text-xl px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500 font-retro tracking-wide"
                        placeholder={t.home.admin.titlePlaceholder}
                    />
                    {!id && title && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                            {t.home.admin.slugPreview} <span className="text-red-400">{generatedSlugPreview}</span>
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass} htmlFor="post-content-de">
                        {t.home.admin.contentLabel} (DE)
                    </label>
                    <RichTextEditor
                        id="post-content-de"
                        value={content}
                        onChange={setContent}
                        placeholder={t.home.editor.placeholder}
                    />
                </div>
            </div>

            {/* CONTENT AREA: ENGLISH */}
            <div style={{ display: activeTab === 'en' ? 'block' : 'none' }} className="animate-fade-in">
                <div className="mb-6">
                    <label className={labelClass} htmlFor="post-title-en">
                        {t.home.admin.titleLabel} (EN)
                    </label>
                    <input
                        id="post-title-en"
                        type="text"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white text-xl px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors placeholder-gray-500 font-retro tracking-wide"
                        placeholder="e.g. Batman: The Long Halloween Review"
                    />
                </div>
                <div>
                    <label className={labelClass} htmlFor="post-content-en">
                        {t.home.admin.contentLabel} (EN)
                    </label>
                    <RichTextEditor
                        id="post-content-en"
                        value={contentEn}
                        onChange={setContentEn}
                        placeholder="Write your review in English..."
                    />
                </div>
            </div>

            {/* METADATA + EXTENDED (eigene Datei: `post/PostMetaFields.tsx`) */}
            <PostMetaFields
                labelClass={labelClass}
                t={t}
                currentUser={currentUser}
                onError={setError}
                coverUrl={coverUrl}
                setCoverUrl={setCoverUrl}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                category={category}
                setCategory={setCategory}
                theme={theme}
                setTheme={setTheme}
                itemAuthor={itemAuthor}
                setItemAuthor={setItemAuthor}
                developer={developer}
                setDeveloper={setDeveloper}
                publisher={publisher}
                setPublisher={setPublisher}
                director={director}
                setDirector={setDirector}
                producer={producer}
                setProducer={setProducer}
                screenwriter={screenwriter}
                setScreenwriter={setScreenwriter}
                studio={studio}
                setStudio={setStudio}
                cast={cast}
                setCast={setCast}
                runtime={runtime}
                setRuntime={setRuntime}
                seasonCount={seasonCount}
                setSeasonCount={setSeasonCount}
                episodeCount={episodeCount}
                setEpisodeCount={setEpisodeCount}
                productionYears={productionYears}
                setProductionYears={setProductionYears}
                pageCount={pageCount}
                setPageCount={setPageCount}
                releaseYear={releaseYear}
                setReleaseYear={setReleaseYear}
            />

            <div className="flex justify-between pt-4">
                 <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-retro tracking-wider"
                 >
                    <Icon name="rotate-ccw" size={18} /> {t.home.common.cancel}
                 </button>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-retro text-xl tracking-widest px-8 py-3 rounded transform hover:-translate-y-1 hover:shadow-[0_4px_0_rgb(127,29,29)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Icon name="save" size={20} />
                    {isSubmitting ? t.home.common.saving.toUpperCase() : (id ? t.home.admin.updateBtn : t.home.admin.publishBtn)}
                </button>
            </div>
         </form>
       </div>
    </div>
  );
};