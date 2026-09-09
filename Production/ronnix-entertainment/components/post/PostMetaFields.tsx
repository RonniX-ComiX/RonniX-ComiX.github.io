/**
 * post/PostMetaFields.tsx — Metadaten-Formular für CreatePost (Cover bis Specs).
 *
 * Feature: Cover-URL + Storage-Upload, Publish-Datum, Kategorie, Multi-Themes
 * (max `MAX_THEMES_PER_POST`), getrennte Credits (Executive Editor /
 * Cover-Künstler / Autor / Zeichner / Tusche / Kolorist / Letterer /
 * Redakteur), Herkunft (Jahr DE + Original + Land, Verlag DE + Original) sowie
 * kategorieabhängige Extended-Felder. Reine Darstellung + Upload;
 * Validierung/Speichern bleiben in `pages/CreatePost.tsx`.
 * Benutzung: `<PostMetaFields {...felder} />`.
 * Gehört NICHT hierher: Titel/Content-Tabs, Submit-Logik (CreatePost).
 */

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { Icon } from '../icons/Icon';
import { logError } from '../../utils/logger';
import { POST_CATEGORIES, POST_THEMES, MAX_THEMES_PER_POST } from '../../utils/appConfig';

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
  themes?: string[];
  setThemes?: React.Dispatch<React.SetStateAction<string[]>>;
  developer: string;
  setDeveloper: React.Dispatch<React.SetStateAction<string>>;
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
  executiveEditor: string;
  setExecutiveEditor: React.Dispatch<React.SetStateAction<string>>;
  coverArtistsRaw: string;
  setCoverArtistsRaw: React.Dispatch<React.SetStateAction<string>>;
  creditAuthor: string;
  setCreditAuthor: React.Dispatch<React.SetStateAction<string>>;
  creditArtist: string;
  setCreditArtist: React.Dispatch<React.SetStateAction<string>>;
  creditInker: string;
  setCreditInker: React.Dispatch<React.SetStateAction<string>>;
  creditColorist: string;
  setCreditColorist: React.Dispatch<React.SetStateAction<string>>;
  creditLetterer: string;
  setCreditLetterer: React.Dispatch<React.SetStateAction<string>>;
  creditEditor: string;
  setCreditEditor: React.Dispatch<React.SetStateAction<string>>;
  releaseYearDe: string;
  setReleaseYearDe: React.Dispatch<React.SetStateAction<string>>;
  releaseYearOriginal: string;
  setReleaseYearOriginal: React.Dispatch<React.SetStateAction<string>>;
  originCountry: string;
  setOriginCountry: React.Dispatch<React.SetStateAction<string>>;
  publisherDe: string;
  setPublisherDe: React.Dispatch<React.SetStateAction<string>>;
  publisherOriginal: string;
  setPublisherOriginal: React.Dispatch<React.SetStateAction<string>>;
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
  themes,
  setThemes,
  developer,
  setDeveloper,
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
  executiveEditor,
  setExecutiveEditor,
  coverArtistsRaw,
  setCoverArtistsRaw,
  creditAuthor,
  setCreditAuthor,
  creditArtist,
  setCreditArtist,
  creditInker,
  setCreditInker,
  creditColorist,
  setCreditColorist,
  creditLetterer,
  setCreditLetterer,
  creditEditor,
  setCreditEditor,
  releaseYearDe,
  setReleaseYearDe,
  releaseYearOriginal,
  setReleaseYearOriginal,
  originCountry,
  setOriginCountry,
  publisherDe,
  setPublisherDe,
  publisherOriginal,
  setPublisherOriginal,
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

  const effThemes = themes ?? [theme];
  const toggleTheme = (key: string) => {
    if (!setThemes) { setTheme(key); return; }
    if (effThemes.includes(key)) {
      const next = effThemes.filter((k) => k !== key);
      setThemes(next.length > 0 ? next : [key]);
      setTheme(next[0] || key);
    } else {
      if (effThemes.length >= MAX_THEMES_PER_POST) {
        onError(`Max. ${MAX_THEMES_PER_POST} Themen pro Post.`);
        return;
      }
      const next = [...effThemes, key];
      setThemes(next);
      setTheme(next[0]);
    }
  };

  const inputClass = "w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500";
  const meta = t?.home?.admin?.metadata || {};
  const themesDict = t?.home?.admin?.themes || {};

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
                      className={inputClass}
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
                      className={`${inputClass} appearance-none`}
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
                      {(POST_CATEGORIES as readonly string[]).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
          </div>

          <div>
              <span className={labelClass} id="meta-themes-label">
                  {t.home.admin.themeLabel} (max. {MAX_THEMES_PER_POST})
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="meta-themes-label">
                  {(POST_THEMES as readonly string[]).map((key) => {
                    const active = effThemes.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTheme(key)}
                        aria-pressed={active}
                        className={`px-3 py-2 rounded-lg border text-sm font-bold transition ${
                          active
                            ? 'bg-red-700 border-red-500 text-white'
                            : 'bg-black border-neutral-700 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {themesDict[key] || key}
                      </button>
                    );
                  })}
              </div>
          </div>
      </div>

      {/* CREDITS (getrennt, alle optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-neutral-800 mt-8">
          <div className="md:col-span-2">
                  <h3 className="text-xl font-retro text-red-500 mb-1 flex items-center gap-2">
                  <Icon name="users" size={20} /> {meta.creditsTitle || 'Credits (optional — leere Felder werden nicht angezeigt)'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Getrennte Rollen statt einem Sammelfeld.</p>
          </div>

          <div>
              <label className={labelClass} htmlFor="meta-executiveEditor">{meta.executiveEditor || 'Chefredakteur / Executive Editor'}</label>
              <div className="relative">
                  <Icon name="shield" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-executiveEditor" type="text" value={executiveEditor} onChange={(e) => setExecutiveEditor(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-coverArtists">{meta.coverArtists || 'Cover-Künstler (Komma-getrennt)'}</label>
              <div className="relative">
                  <Icon name="image" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-coverArtists" type="text" value={coverArtistsRaw} onChange={(e) => setCoverArtistsRaw(e.target.value)} className={inputClass} placeholder="A, B" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditAuthor">{meta.creditAuthor || 'Autor'}</label>
              <div className="relative">
                  <Icon name="pen-tool" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditAuthor" type="text" value={creditAuthor} onChange={(e) => setCreditAuthor(e.target.value)} className={inputClass} placeholder="Stan Lee, …" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditArtist">{meta.creditArtist || 'Zeichner'}</label>
              <div className="relative">
                  <Icon name="palette" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditArtist" type="text" value={creditArtist} onChange={(e) => setCreditArtist(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditInker">{meta.creditInker || 'Tuschezeichner (Ink)'}</label>
              <div className="relative">
                  <Icon name="pen-tool" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditInker" type="text" value={creditInker} onChange={(e) => setCreditInker(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditColorist">{meta.creditColorist || 'Kolorist'}</label>
              <div className="relative">
                  <Icon name="palette" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditColorist" type="text" value={creditColorist} onChange={(e) => setCreditColorist(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditLetterer">{meta.creditLetterer || 'Letterer'}</label>
              <div className="relative">
                  <Icon name="file-text" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditLetterer" type="text" value={creditLetterer} onChange={(e) => setCreditLetterer(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-creditEditor">{meta.creditEditor || 'Herausgeber / Redakteur'}</label>
              <div className="relative">
                  <Icon name="book-open" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-creditEditor" type="text" value={creditEditor} onChange={(e) => setCreditEditor(e.target.value)} className={inputClass} placeholder="…" />
              </div>
          </div>
      </div>

      {/* HERKUNFT (DE vs. Original) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-neutral-800 mt-8">
          <div className="md:col-span-2">
                  <h3 className="text-xl font-retro text-red-500 mb-1 flex items-center gap-2">
                  <Icon name="globe" size={20} /> {meta.originTitle || 'Herkunft (DE vs. Original)'}
                  </h3>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-releaseYearDe">{meta.releaseYearDe || 'Erscheinungsjahr DE'}</label>
              <div className="relative">
                  <Icon name="calendar" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input type="number" value={releaseYearDe} id="meta-releaseYearDe" onChange={(e) => setReleaseYearDe(e.target.value)} className={inputClass} placeholder="2024" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-releaseYearOriginal">{meta.releaseYearOriginal || 'Erscheinungsjahr Original'}</label>
              <div className="relative">
                  <Icon name="calendar" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input type="number" value={releaseYearOriginal} id="meta-releaseYearOriginal" onChange={(e) => setReleaseYearOriginal(e.target.value)} className={inputClass} placeholder="2022" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-originCountry">{meta.originCountry || 'Ursprungsland'}</label>
              <div className="relative">
                  <Icon name="globe" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-originCountry" list="origin-country-list" type="text" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} className={inputClass} placeholder="Japan" />
                  <datalist id="origin-country-list">
                    <option value="Deutschland" /><option value="USA" /><option value="Japan" />
                    <option value="Frankreich" /><option value="Belgien" /><option value="Italien" />
                    <option value="Spanien" /><option value="UK" />
                  </datalist>
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-publisherDe">{meta.publisherDe || 'Verlag DE'}</label>
              <div className="relative">
                  <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-publisherDe" type="text" value={publisherDe} onChange={(e) => setPublisherDe(e.target.value)} className={inputClass} placeholder="Panini, Carlsen, …" />
              </div>
          </div>
          <div>
              <label className={labelClass} htmlFor="meta-publisherOriginal">{meta.publisherOriginal || 'Verlag Original-Land'}</label>
              <div className="relative">
                  <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input id="meta-publisherOriginal" type="text" value={publisherOriginal} onChange={(e) => setPublisherOriginal(e.target.value)} className={inputClass} placeholder="Marvel, Shueisha, …" />
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
                          className={inputClass}
                          placeholder="Nintendo, Indie Dev..."
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
                          <input id="meta-director" type="text" value={director} onChange={(e) => setDirector(e.target.value)} className={inputClass} placeholder="Christopher Nolan / Showrunner" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-producer">{t.home.admin.metadata.producer}</label>
                      <div className="relative">
                          <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-producer" type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className={inputClass} placeholder="Kevin Feige" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-screenwriter">{t.home.admin.metadata.screenwriter}</label>
                      <div className="relative">
                          <Icon name="film" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-screenwriter" type="text" value={screenwriter} onChange={(e) => setScreenwriter(e.target.value)} className={inputClass} placeholder="Quentin Tarantino" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-studio">{t.home.admin.metadata.studio}</label>
                      <div className="relative">
                          <Icon name="briefcase" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-studio" type="text" value={studio} onChange={(e) => setStudio(e.target.value)} className={inputClass} placeholder="Warner Bros, A24, HBO" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-runtime">{t.home.admin.metadata.runtime}</label>
                      <div className="relative">
                          <Icon name="clock" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-runtime" type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)} className={inputClass} placeholder="120 (Minuten)" />
                      </div>
                  </div>
                  <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="meta-cast">{t.home.admin.metadata.cast}</label>
                      <div className="relative">
                          <Icon name="users" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-cast" type="text" value={cast} onChange={(e) => setCast(e.target.value)} className={inputClass} placeholder="Robert Downey Jr., Chris Evans..." />
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
                          <input id="meta-seasonCount" type="number" value={seasonCount} onChange={(e) => setSeasonCount(e.target.value)} className={inputClass} placeholder="5" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-episodeCount">{t.home.admin.metadata.episodeCount}</label>
                      <div className="relative">
                          <Icon name="tv" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-episodeCount" type="number" value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} className={inputClass} placeholder="62" />
                      </div>
                  </div>
                  <div>
                      <label className={labelClass} htmlFor="meta-productionYears">{t.home.admin.metadata.productionYears}</label>
                      <div className="relative">
                          <Icon name="calendar-range" size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input id="meta-productionYears" type="text" value={productionYears} onChange={(e) => setProductionYears(e.target.value)} className={inputClass} placeholder="2008-2013" />
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
                          className={inputClass}
                          placeholder="128"
                      />
                  </div>
              </div>
          )}
      </div>
    </>
  );
};
