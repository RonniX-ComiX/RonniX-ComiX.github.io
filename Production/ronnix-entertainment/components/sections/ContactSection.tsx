
import React from 'react';
import { Mail, Facebook, Instagram, Send } from 'lucide-react';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';

export const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="mb-16">
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
          className="text-pink-600 hover:text-pink-500 transform hover:scale-110 hover:rotate-6 transition-all duration-300"
        >
          <Instagram size={40} />
        </a>
        <a 
          href="mailto:ronnixcomix@gmail.com" 
          title="Mail" 
          className="text-red-600 hover:text-red-500 transform hover:scale-110 hover:-rotate-6 transition-all duration-300"
        >
          <Mail size={40} />
        </a>
        <a 
          href="https://www.facebook.com/p/RonniX-ComiX-100068056538624/" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Facebook" 
          className="text-blue-600 hover:text-blue-500 transform hover:scale-110 hover:rotate-6 transition-all duration-300"
        >
          <Facebook size={40} />
        </a>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-red-900/20">
        <form 
          className="space-y-6" 
          action="https://formsubmit.co/ronnixcomix@gmail.com" 
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
                className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
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
                className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
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
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
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
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600 resize-none"
              placeholder={t.home.contact.messagePlaceholder}
            ></textarea>
          </div>

          {/* Hidden Fields for FormSubmit */}
          <input type="text" name="_honey" style={{ display: 'none' }} />
          <input type="hidden" name="_replyto" value="email" />
          <input type="hidden" name="_subject" value={t.home.contact.formSubject} />
          <input type="hidden" name="_autoresponse" value={t.home.contact.formAutoResponse} />
          <input type="hidden" name="_next" value="https://ronnix-comix.github.io/" />

          <div className="text-center pt-2">
            <button 
              type="submit" 
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transform hover:-translate-y-1 w-full md:w-auto"
            >
              {t.home.contact.submit} <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
