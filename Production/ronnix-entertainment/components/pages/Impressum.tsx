import React from 'react';
import { Facebook, Instagram, Mail } from 'lucide-react';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';

export const Impressum: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-12 text-gray-300 min-h-[60vh]">
      <div className="max-w-3xl mx-auto bg-neutral-900/50 p-8 rounded-2xl border border-red-900/20">
        <SectionTitle title={t.legal.impressum.title} />
        
        <div className="space-y-8 text-center md:text-left">
          
          {/* Angaben gemäß § 5 TMG */}
          <div>
            <h3 className="text-xl font-retro text-red-500 mb-4 tracking-wide">{t.legal.impressum.tmg}</h3>
            <p className="text-lg font-bold text-white">Ron Hartmann</p>
            <p>Emsstraße 13</p>
            <p>38120 Braunschweig</p>
            <p>Niedersachsen</p>
            <p>Deutschland</p>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-xl font-retro text-red-500 mb-4 tracking-wide">{t.legal.impressum.contact}</h3>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
              <Mail className="text-red-600" size={20} />
              <a href="mailto:ronnixcomix@gmail.com" className="hover:text-red-500 transition-colors">
                ronnixcomix@gmail.com
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="border-t border-neutral-800 pt-8 mt-8">
            <h3 className="text-xl font-retro text-red-500 mb-6 tracking-wide text-center">{t.legal.impressum.socials}</h3>
            <div className="flex justify-center space-x-8">
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
                href="https://www.facebook.com/p/RonniX-ComiX-100068056538624/" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Facebook" 
                className="text-blue-600 hover:text-blue-500 transform hover:scale-110 hover:rotate-6 transition-all duration-300"
              >
                <Facebook size={40} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};