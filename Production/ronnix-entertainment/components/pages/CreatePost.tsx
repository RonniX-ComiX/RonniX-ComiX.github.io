
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../firebase';
import { SectionTitle } from '../SectionTitle';
import { RichTextEditor } from '../RichTextEditor';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Save, AlertTriangle, Image as ImageIcon, RotateCcw, Calendar, Tag, Globe, Book, Briefcase, Hash, User, Gamepad2, Clapperboard, Users, Film, Clock, Tv, CalendarRange, Layers } from 'lucide-react';

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
  const [isUploading, setIsUploading] = useState(false);

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) { setError('Nur Bilddateien (max 5MB).'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Cover max 5MB.'); return; }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const snap = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(snap.ref);
      setCoverUrl(url);
    } catch (e) {
      console.error('Cover upload failed', e);
      setError('Cover-Upload fehlgeschlagen (Storage-Regeln/Admin prüfen).');
    } finally {
      setIsUploading(false);
    }
  };

  // Strict Access Control
  if (!currentUser || !isAdmin) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="inline-block p-6 border-2 border-red-600 rounded-lg bg-black">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-retro text-white mb-2">{t.home.common.accessDenied}</h2>
            <p className="text-gray-400">{t.home.common.adminOnly}</p>
        </div>
      </div>
    );
  }

  // Fetch data if editing
  useEffect(() => {
    if (id) {
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
                console.error("Error fetching doc:", err);
                setError(t.home.admin.errorLoad);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }
  }, [id]);

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
      console.error("Error saving document: ", err);
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
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      );
  }

  const generatedSlugPreview = title ? generateSlug(title) : '...';
  const labelClass = "block text-lg font-bold text-white mb-2 font-sans";

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
       <div className="max-w-4xl mx-auto">
         <SectionTitle title={id ? t.home.admin.editTitle : t.home.admin.createTitle} />
         
         <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {error && (
                <div className="bg-red-900/20 border border-red-600 text-red-200 p-4 rounded mb-6 flex items-center gap-3">
                    <AlertTriangle size={24} />
                    {error}
                </div>
            )}

            {/* Language Tabs */}
            <div className="flex space-x-2 border-b border-neutral-800 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab('de')}
                    className={`px-6 py-3 font-bold font-retro tracking-wide transition-all rounded-t-lg flex items-center gap-2 ${
                        activeTab === 'de' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-neutral-900 text-gray-400 hover:text-white hover:bg-neutral-800'
                    }`}
                >
                    <Globe size={16} /> {t.home.admin.languageTabs.de}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={`px-6 py-3 font-bold font-retro tracking-wide transition-all rounded-t-lg flex items-center gap-2 ${
                        activeTab === 'en' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-900 text-gray-400 hover:text-white hover:bg-neutral-800'
                    }`}
                >
                    <Globe size={16} /> {t.home.admin.languageTabs.en}
                </button>
            </div>

            {/* CONTENT AREA: DEUTSCH */}
            <div style={{ display: activeTab === 'de' ? 'block' : 'none' }} className="animate-fade-in">
                <div className="mb-6">
                    <label className={labelClass}>
                        {t.home.admin.titleLabel} (DE)
                    </label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white text-xl px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700 font-retro tracking-wide"
                        placeholder={t.home.admin.titlePlaceholder}
                    />
                    {!id && title && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                            {t.home.admin.slugPreview} <span className="text-red-400">{generatedSlugPreview}</span>
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>
                        {t.home.admin.contentLabel} (DE)
                    </label>
                    <RichTextEditor 
                        value={content} 
                        onChange={setContent} 
                        placeholder={t.home.editor.placeholder}
                    />
                </div>
            </div>

            {/* CONTENT AREA: ENGLISH */}
            <div style={{ display: activeTab === 'en' ? 'block' : 'none' }} className="animate-fade-in">
                <div className="mb-6">
                    <label className={labelClass}>
                        {t.home.admin.titleLabel} (EN)
                    </label>
                    <input 
                        type="text" 
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white text-xl px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors placeholder-gray-700 font-retro tracking-wide"
                        placeholder="e.g. Batman: The Long Halloween Review"
                    />
                </div>
                <div>
                    <label className={labelClass}>
                        {t.home.admin.contentLabel} (EN)
                    </label>
                    <RichTextEditor 
                        value={contentEn} 
                        onChange={setContentEn} 
                        placeholder="Write your review in English..."
                    />
                </div>
            </div>

            {/* METADATA (Shared) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-neutral-800 mt-8">
                <div>
                    <label className={labelClass}>
                        {t.home.admin.coverUrlLabel}
                    </label>
                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        <label className="text-sm text-gray-400 cursor-pointer hover:text-white">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverUpload(e.target.files?.[0])} />
                            <span className="underline">{isUploading ? 'Lade hoch…' : 'Oder Bild hochladen (Storage, max 5MB)'}</span>
                        </label>
                        {coverUrl?.startsWith('http') && <img src={coverUrl} alt="Cover Vorschau" className="h-10 w-auto rounded border border-neutral-700" loading="lazy" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tipp: Resize-Extension (Storage Resize Images) für AVIF/WebP-Thumbs aktivieren.</p>
                </div>

                <div>
                    <label className={labelClass}>
                        {t.home.admin.scheduleLabel}
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input 
                            type="datetime-local" 
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700 appearance-none"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>
                        {t.home.admin.categoryLabel}
                    </label>
                    <div className="relative">
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-black border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                        >
                            <option value="news">{t.home.news.title}</option>
                            <option value="comics">{t.home.comics.title}</option>
                            <option value="books">{t.home.books.title}</option>
                            <option value="games">{t.home.games.title}</option>
                            <option value="movies">{t.home.movies.title}</option>
                            <option value="series">{t.home.series.title}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>
                        {t.home.admin.themeLabel}
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-3 text-gray-500" size={18} />
                        <select 
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                        >
                            <option value="review">{t.home.admin.themes.review}</option>
                            <option value="news">{t.home.admin.themes.news}</option>
                            <option value="opinion">{t.home.admin.themes.opinion}</option>
                            <option value="tutorial">{t.home.admin.themes.tutorial}</option>
                            <option value="spotlight">{t.home.admin.themes.spotlight}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXTENDED METADATA SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-neutral-800 mt-8 animate-fade-in">
                <div className="md:col-span-2">
                        <h3 className="text-xl font-retro text-red-500 mb-4 flex items-center gap-2">
                        <Book size={20} /> Zusatzinformationen (für Specs-Card)
                        </h3>
                </div>

                {/* ITEM AUTHOR (Comics & Books) */}
                {(category === 'comics' || category === 'books') && (
                    <div>
                        <label className={labelClass}>
                            {t.home.admin.metadata.itemAuthor}
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                                type="text" 
                                value={itemAuthor}
                                onChange={(e) => setItemAuthor(e.target.value)}
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                                placeholder="Stan Lee, J.K. Rowling..."
                            />
                        </div>
                    </div>
                )}

                {/* DEVELOPER (Games) */}
                {category === 'games' && (
                    <div>
                        <label className={labelClass}>
                            {t.home.admin.metadata.developer}
                        </label>
                        <div className="relative">
                            <Gamepad2 size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                                type="text" 
                                value={developer}
                                onChange={(e) => setDeveloper(e.target.value)}
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                                placeholder="Nintendo, Indie Dev..."
                            />
                        </div>
                    </div>
                )}

                {/* PUBLISHER (Comics, Books, Games) */}
                {(category === 'comics' || category === 'books' || category === 'games') && (
                    <div>
                        <label className={labelClass}>
                            {t.home.admin.metadata.publisher}
                        </label>
                        <div className="relative">
                            <Briefcase size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                                type="text" 
                                value={publisher}
                                onChange={(e) => setPublisher(e.target.value)}
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                                placeholder="Panini, Carlsen, Marvel..."
                            />
                        </div>
                    </div>
                )}

                {/* SHARED: MOVIES & SERIES */}
                {(category === 'movies' || category === 'series') && (
                    <>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.director}</label>
                            <div className="relative">
                                <Clapperboard size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={director} onChange={(e) => setDirector(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="Christopher Nolan / Showrunner" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.producer}</label>
                            <div className="relative">
                                <Briefcase size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="Kevin Feige" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.screenwriter}</label>
                            <div className="relative">
                                <Film size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={screenwriter} onChange={(e) => setScreenwriter(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="Quentin Tarantino" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.studio}</label>
                            <div className="relative">
                                <Briefcase size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={studio} onChange={(e) => setStudio(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="Warner Bros, A24, HBO" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.runtime}</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="120 (Minuten)" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>{t.home.admin.metadata.cast}</label>
                            <div className="relative">
                                <Users size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={cast} onChange={(e) => setCast(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="Robert Downey Jr., Chris Evans..." />
                            </div>
                        </div>
                    </>
                )}

                {/* SERIES SPECIFIC */}
                {category === 'series' && (
                    <>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.seasonCount}</label>
                            <div className="relative">
                                <Layers size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="number" value={seasonCount} onChange={(e) => setSeasonCount(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="5" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.episodeCount}</label>
                            <div className="relative">
                                <Tv size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="number" value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="62" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.home.admin.metadata.productionYears}</label>
                            <div className="relative">
                                <CalendarRange size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={productionYears} onChange={(e) => setProductionYears(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700" placeholder="2008-2013" />
                            </div>
                        </div>
                    </>
                )}

                {/* PAGE COUNT (Comics & Books) */}
                {(category === 'comics' || category === 'books') && (
                    <div>
                        <label className={labelClass}>
                            {t.home.admin.metadata.pageCount}
                        </label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                                type="number" 
                                value={pageCount}
                                onChange={(e) => setPageCount(e.target.value)}
                                className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                                placeholder="128"
                            />
                        </div>
                    </div>
                )}

                {/* RELEASE YEAR (Single Year - All categories except Series if series uses productionYears) */}
                <div>
                    <label className={labelClass}>
                        {t.home.admin.metadata.releaseYear}
                    </label>
                    <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-3 text-gray-500" />
                        <input 
                            type="number" 
                            value={releaseYear}
                            onChange={(e) => setReleaseYear(e.target.value)}
                            className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-700"
                            placeholder="2024"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                 <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-retro tracking-wider"
                 >
                    <RotateCcw size={18} /> {t.home.common.cancel}
                 </button>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-retro text-xl tracking-widest px-8 py-3 rounded transform hover:-translate-y-1 hover:shadow-[0_4px_0_rgb(127,29,29)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {isSubmitting ? t.home.common.saving.toUpperCase() : (id ? t.home.admin.updateBtn : t.home.admin.publishBtn)}
                </button>
            </div>
         </form>
       </div>
    </div>
  );
};