/**
 * ContactSection.tsx — Kontaktbereich mit Social-Links und Formular.
 *
 * Feature: Social-Icons (extern) + natives Formular via FormSubmit
 * (Endpunkt aus `utils/appConfig.ts`, Honeypot `_honey`). `_next` zeigt
 * same-origin auf `/danke` (eigene Danke-Route, kein Fremd-Redirect). Benutzung: `/contact`
 * (+ `/en/contact`) in `App.tsx`, Formular-Texte aus `locales/home.ts`.
 * Gehört NICHT hierher: Bestätigungsseite (`components/pages/Danke.tsx`).
 */

import React from 'react';
import { Icon } from '../icons/Icon';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { CONTACT_FORM_ENDPOINT } from '../../utils/appConfig';
import { ComicButton } from '../ComicButton';
import { ScrollReveal } from '../ScrollReveal';

export const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  // Same-origin Danke-URL (FormSubmit braucht absolut; läuft auf allen 6 Domains korrekt).
  const thanksUrl = typeof window !== 'undefined' ? `${window.location.origin}/danke` : '/danke';

  return (
    <section>
      <SectionTitle title={t.home.contact.title} />
      
      <p className="text-center mt-4 mb-8 text-gray-400 max-w-lg mx-auto">
        {t.home.contact.subtitle}
      </p>

      {/* Social Icons */}
      <div className="flex justify-center space-x-8 mb-12">
        <a 
          href="https://www.instagram.com/ronnixcomix" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Instagram" 
          className="text-pink-600 hover:text-pink-500 transform hover:scale-110 hover:rotate-6 transition duration-300"
        >
          <Icon name="instagram" size={40} />
        </a>
        <a 
          href="mailto:ronnixcomix@gmail.com" 
          title="Mail" 
          className="text-red-600 hover:text-red-500 transform hover:scale-110 hover:-rotate-6 transition duration-300"
        >
          <Icon name="mail" size={40} />
        </a>
        <a 
          href="https://www.facebook.com/p/RonniX-ComiX-100068056538624/" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Facebook" 
          className="text-blue-600 hover:text-blue-500 transform hover:scale-110 hover:rotate-6 transition duration-300"
        >
          <Icon name="facebook" size={40} />
        </a>
      </div>

      {/* Form */}
      <ScrollReveal>
      <div className="max-w-xl mx-auto bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-red-900/20">
        <form 
          className="space-y-6" 
          action={CONTACT_FORM_ENDPOINT}
          method="POST"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-bold text-red-500">{t.home.contact.nameLabel}</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                placeholder={t.home.contact.namePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-bold text-red-500">{t.home.contact.emailLabel}</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
                placeholder={t.home.contact.emailPlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block mb-2 text-sm font-bold text-red-500">{t.home.contact.subjectLabel}</label>
            <input 
              type="text" 
              id="subject" 
              name="subject" 
              required 
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500"
              placeholder={t.home.contact.subjectPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="message" className="block mb-2 text-sm font-bold text-red-500">{t.home.contact.messageLabel}</label>
            <textarea 
              id="message" 
              name="message" 
              rows={4} 
              required 
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500 resize-none"
              placeholder={t.home.contact.messagePlaceholder}
            ></textarea>
          </div>

          {/* Hidden Fields for FormSubmit */}
          <input type="text" name="_honey" style={{ display: 'none' }} />
          <input type="hidden" name="_replyto" value="email" />
          <input type="hidden" name="_subject" value={t.home.contact.formSubject} />
          <input type="hidden" name="_autoresponse" value={t.home.contact.formAutoResponse} />
          <input type="hidden" name="_next" value={thanksUrl} />

          <div className="text-center pt-2">
            <ComicButton
              type="submit"
              className="px-8 py-3 text-xl w-full md:w-auto"
            >
              {t.home.contact.submit} <Icon name="send" size={18} />
            </ComicButton>
          </div>
        </form>
      </div>
      </ScrollReveal>
    </section>
  );
};
