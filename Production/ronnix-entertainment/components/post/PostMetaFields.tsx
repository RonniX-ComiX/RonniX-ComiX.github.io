/**
 * post/PostMetaFields.tsx — Metadaten-Formular für CreatePost (Cover bis Specs).
 *
 * Feature: Cover-URL + Storage-Upload (eigener `isUploading`-State),
 * Publish-Datum, Kategorie/Theme-Selects sowie kategorieabhängige
 * Extended-Felder (Autor/Developer/Publisher, Film/Serie-Felder, Seiten,
 * Jahr). Reine Darstellung + Upload; Validierung/Speichern bleiben in
 * `pages/CreatePost.tsx`. Benutzung: `<PostMetaFields {...felder} />`.
 * Gehört NICHT hierher: Titel/Content-Tabs, Submit-Logik (CreatePost).
 */

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { Icon } from '../icons/Icon';
import { logError } from '../../utils/logger';

export interface PostMetaFieldsProps {
  labelClass: string;
  t: any;
  currentUser: any;
  onError: (msg: string) => void;
  coverUrl: string;
  setCoverUrl: React.Dispatch<React.SetStateAction<string>>;
  scheduledDate: string;
  setScheduledDate: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  itemAuthor: string;
  setItemAuthor: React.Dispatch<React.SetStateAction<string>>;
  developer: string;
  setDeveloper: React.Dispatch<React.SetStateAction<string>>;
  publisher: string;
  setPublisher: React.Dispatch<React.SetStateAction<string>>;
  director: string;
  setDirector: React.Dispatch<React.SetStateAction<string>>;
  producer: string;
  setProducer: React.Dispatch<React.SetStateAction<string>>;
  screenwriter: string;
  setScreenwriter: React.Dispatch<React.SetStateAction<string>>;
  studio: string;
  setStudio: React.Dispatch<React.SetStateAction<string>>;
  cast: string;
  setCast: React.Dispatch<React.SetStateAction<string>>;
  runtime: string;
  setRuntime: React.Dispatch<React.SetStateAction<string>>;
  seasonCount: string;
  setSeasonCount: React.Dispatch<React.SetStateAction<string>>;
  episodeCount: string;
  setEpisodeCount: React.Dispatch<React.SetStateAction<string>>;
  productionYears: string;
  setProductionYears: React.Dispatch<React.SetStateAction<string>>;
  pageCount: string;
  setPageCount: React.Dispatch<React.SetStateAction<string>>;
  releaseYear: string;
  setReleaseYear: React.Dispatch<React.SetStateAction<string>>;
}

export const PostMetaFields: React.FC<PostMetaFieldsProps> = ({
  labelClass,
  t,
  currentUser,
  onError,
  coverUrl,
  setCoverUrl,
  scheduledDate,
  setScheduledDate,
  category,
  setCategory,
  theme,
  setTheme,
  itemAuthor,
  setItemAuthor,
  developer,
  setDeveloper,
  publisher,
  setPublisher,
  director,
  setDirector,
  producer,
  setProducer,
  screenwriter,
  setScreenwriter,
  studio,
  setStudio,
  cast,
  setCast,
  runtime,
  setRuntime,
  seasonCount,
  setSeasonCount,
  episodeCount,
  setEpisodeCount,
  productionYears,
  setProductionYears,
  pageCount,
  setPageCount,
  releaseYear,
  setReleaseYear,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) { onError('Nur Bilddateien (max 5MB).'); return; }
    if (file.size > 5 * 1024 * 1024) { onError('Cover max 5MB.'); return; }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const snap = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(snap.ref);
      setCoverUrl(url);
    } catch (e) {
      logError('post-meta', 'Cover upload failed', e);
      onError('Cover-Upload fehlgeschlagen (Storage-Regeln/Admin prüfen).');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* METADATA (Shared) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-neutral-800 mt-8">
          <div>
              <label className={labelClass} htmlFor="meta-cover">
                  {t.home.admin.coverUrlLabel}
              </label>
              <div className="relative">
                  <Icon name="image" className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input
                          id="meta-cover"
                          type="text"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                      placeholder="https://..."
                  />
              </div>
              <div className="mt-2 flex items-center gap-3">
                  <label className="text-sm text-gray-400 cursor-pointer hover:text-white">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverUpload(e.target.files?.[0])} />
                      <span className="underline">{isUploading ? 'Lade hoch…' : 'Oder Bild hochladen (Storage, max 5MB)'}</span>
                  </label>
                  {coverUrl?.startsWith('http') && <img src={coverUrl} alt="Cover Vorschau" className="h-10 w-auto rounded border border-neutral-700" loading="lazy" decoding="async" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">Tipp: Resize-Extension (Storage Resize Images) für AVIF/WebP-Thumbs aktivieren.</p>
          </div>

          <div>
              <label className={labelClass} htmlFor="meta-schedule">
                  {t.home.admin.scheduleLabel}
              </label>
              <div className="relative">
                  <Icon name="calendar" className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input
                          id="meta-schedule"
                          type="datetime-local"
                          value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500 appearance-none"
                      style={{ colorScheme: 'dark' }}
                  />
              </div>
          </div>

          <div>
              <label className={labelClass} htmlFor="meta-category">
                  {t.home.admin.categoryLabel}
              </label>
              <div className="relative">
                  <select
                      id="meta-category"
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
              <label className={labelClass} htmlFor="meta-theme">
                  {t.home.admin.themeLabel}
              </label>
              <div className="relative">
                  <Icon name="tag" className="absolute left-3 top-3 text-gray-500" size={18} />
                  <select
                      id="meta-theme"
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
                  <Icon name="book" size={20} /> Zusatzinformationen (für Specs-Card)
                  </h3>
          </div>

          {/* ITEM AUTHOR (Comics & Books) */}
          {(category === 'comics' || category === 'books') && (
              <div>
                  <label className={labelClass} htmlFor="meta-itemAuthor">
                      {t.home.admin.metadata.itemAuthor}
                  </label>
                  <div className="relative">
                      <Icon name="user" size={18} className="absolute left-3 top-3 text-gray-500" />
                      <input
                          type="text"
                          value={itemAuthor}
                          id="meta-itemAuthor"
                          onChange={(e) => setItemAuthor(e.target.value)}
                          className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                          placeholder="Stan Lee, J.K. Rowling..."
                      />
                  </div>
              </div>
          )}

          {/* DEVELOPER (Games) */}
          {category === 'games' && (
              <div>
                  <label className={labelClass} htmlFor="meta-developer">
                      {t.home.admin.metadata.developer}
                  </label>
                  <div className="relative">
                      <Icon name="gamepad" size={18} className="absolute left-3 top-3 text-gray-500" />
                      <input
                          type="text"
                          value={developer}
                          id="meta-developer"
                          onChange={(e) => setDeveloper(e.target.value)}
                          className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                          placeholder="Nintendo, Indie Dev..."
                      />
                  </div>
              </div>
          )}

          {/* PUBLISHER (Comics, Books, Games) */}
          {(category === 'comics' || category === 'books' || category === 'games') && (
              <div>
                  <label className={labelClass} htmlFor="meta-publisher">
                      {t.home.admin.metadata.publisher}
                  </label>
                  <div className="relative">
                      <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                      <input
                          type="text"
                          value={publisher}
                          id="meta-publisher"
                          onChange={(e) => setPublisher(e.target.value)}
                          className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                          placeholder="Panini, Carlsen, Marvel..."
                      />
                  </div>
              </div>
          )}

          {/* SHARED: MOVIES & SERIES */}
          {(category === 'movies' || category === 'series') && (
              <>
                  <div>
                      <label className={labelClass} htmlFor="meta-director">{t.home.admin.metadata.director}</label>
                      <div className="relative">
                          <Icon name="clapperboard" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-director" type="text" value={director} onChange={(e) => setDirector(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="Christopher Nolan / Showrunner" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-producer">{t.home.admin.metadata.producer}</label>
                      <div className="relative">
                          <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-producer" type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="Kevin Feige" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-screenwriter">{t.home.admin.metadata.screenwriter}</label>
                      <div className="relative">
                          <Icon name="film" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-screenwriter" type="text" value={screenwriter} onChange={(e) => setScreenwriter(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="Quentin Tarantino" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-studio">{t.home.admin.metadata.studio}</label>
                      <div className="relative">
                          <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-studio" type="text" value={studio} onChange={(e) => setStudio(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="Warner Bros, A24, HBO" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-runtime">{t.home.admin.metadata.runtime}</label>
                      <div className="relative">
                          <Icon name="clock" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-runtime" type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="120 (Minuten)" />
                      </div>
                  </div>
                  <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="meta-cast">{t.home.admin.metadata.cast}</label>
                      <div className="relative">
                          <Icon name="users" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-cast" type="text" value={cast} onChange={(e) => setCast(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="Robert Downey Jr., Chris Evans..." />
                      </div>
                  </div>
              </>
          )}

          {/* SERIES SPECIFIC */}
          {category === 'series' && (
              <>
                  <div>
                      <label className={labelClass} htmlFor="meta-seasonCount">{t.home.admin.metadata.seasonCount}</label>
                      <div className="relative">
                          <Icon name="layers" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-seasonCount" type="number" value={seasonCount} onChange={(e) => setSeasonCount(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="5" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-episodeCount">{t.home.admin.metadata.episodeCount}</label>
                      <div className="relative">
                          <Icon name="tv" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-episodeCount" type="number" value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="62" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-productionYears">{t.home.admin.metadata.productionYears}</label>
                      <div className="relative">
                          <Icon name="calendar-range" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-productionYears" type="text" value={productionYears} onChange={(e) => setProductionYears(e.target.value)} className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500" placeholder="2008-2013" />
                      </div>
                  </div>
              </>
          )}

          {/* PAGE COUNT (Comics & Books) */}
          {(category === 'comics' || category === 'books') && (
              <div>
                  <label className={labelClass} htmlFor="meta-pageCount">
                      {t.home.admin.metadata.pageCount}
                  </label>
                  <div className="relative">
                      <Icon name="hash" size={18} className="absolute left-3 top-3 text-gray-500" />
                      <input
                          type="number"
                              value={pageCount}
                              id="meta-pageCount"
                              onChange={(e) => setPageCount(e.target.value)}
                          className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                          placeholder="128"
                      />
                  </div>
              </div>
          )}

          {/* RELEASE YEAR (Single Year - All categories except Series if series uses productionYears) */}
          <div>
                  <label className={labelClass} htmlFor="meta-releaseYear">
                      {t.home.admin.metadata.releaseYear}
                  </label>
              <div className="relative">
                  <Icon name="calendar" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                      type="number"
                              value={releaseYear}
                              id="meta-releaseYear"
                              onChange={(e) => setReleaseYear(e.target.value)}
                      className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                      placeholder="2024"
                  />
              </div>
          </div>
      </div>
    </>
  );
};
