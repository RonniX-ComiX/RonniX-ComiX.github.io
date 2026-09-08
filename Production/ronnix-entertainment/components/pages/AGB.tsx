
import React from 'react';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';

export const AGB: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-12 text-gray-300 min-h-[60vh]">
      <div className="max-w-4xl mx-auto bg-neutral-900/50 p-8 md:p-12 rounded-2xl border border-red-900/20 shadow-2xl animate-fade-in">
        <SectionTitle title={t.legal.terms.title} />

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          
          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.scopeTitle}</h3>
            <p>{t.legal.terms.scopeText}</p>
          </section>

          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.accountTitle}</h3>
            <p>{t.legal.terms.accountText}</p>
          </section>

          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.copyrightTitle}</h3>
            <p>{t.legal.terms.copyrightText}</p>
          </section>

          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.behaviorTitle}</h3>
            <p>{t.legal.terms.behaviorText}</p>
          </section>

          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.liabilityTitle}</h3>
            <p>{t.legal.terms.liabilityText}</p>
          </section>

          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.terms.lawTitle}</h3>
            <p>{t.legal.terms.lawText}</p>
          </section>

        </div>
      </div>
    </div>
  );
};
