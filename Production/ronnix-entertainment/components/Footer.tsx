
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Shield, FileText, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const legalLinks = [
    { name: t.navigation.footer.impressum, icon: Shield, path: '/impressum' }, 
    { name: t.navigation.footer.privacy, icon: FileText, path: '/datenschutz' }, 
    { name: t.navigation.footer.terms, icon: Scale, path: '/agb' }
  ];

  return (
    <footer className="relative bg-black pt-16 pb-8 overflow-hidden border-t-4 border-neutral-900">
      {/* Background Gradients: Neutral glow instead of red */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center">
          
          {/* Logo & Brand - Side by Side */}
          {/* Hover effect removed */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-8 transform-gpu subpixel-antialiased">
             <div className="relative">
               {/* Glow changed from red-600 to white/neutral */}
               <div className="absolute inset-0 bg-white blur-2xl opacity-20 rounded-full animate-pulse"></div>
               <img 
                 src="./images/ronnix_logo.png" 
                 alt="RonniX Entertainment Logo" 
                 className="h-20 w-auto object-contain relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
               />
             </div>
             <h2 className="text-4xl md:text-5xl font-retro tracking-wider drop-shadow-md">
               {/* Added pr-2 to prevent the 'T' from being clipped by overflow/bounding box */}
               <span className="bg-gradient-to-b from-white via-gray-200 to-neutral-400 bg-clip-text text-transparent pr-2">
                 RonniX Entertainment
               </span>
             </h2>
          </div>

          {/* Social Links - 1:1 Style from Contact Section */}
          <div className="flex justify-center space-x-8 mb-12">
            <a 
              href="https://www.instagram.com/ronnixcomix" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Instagram" 
              className="text-pink-600 hover:text-pink-500 transform-gpu hover:scale-110 hover:rotate-6 transition-all duration-300 will-change-transform"
            >
              <Instagram size={40} />
            </a>
            <a 
              href="mailto:ronnixcomix@gmail.com" 
              title="Mail" 
              className="text-red-600 hover:text-red-500 transform-gpu hover:scale-110 hover:-rotate-6 transition-all duration-300 will-change-transform"
            >
              <Mail size={40} />
            </a>
            <a 
              href="https://www.facebook.com/p/RonniX-ComiX-100068056538624/" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Facebook" 
              className="text-blue-600 hover:text-blue-500 transform-gpu hover:scale-110 hover:rotate-6 transition-all duration-300 will-change-transform"
            >
              <Facebook size={40} />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8 border-t border-neutral-900 pt-8 w-full max-w-3xl">
            {legalLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest group"
              >
                <link.icon size={16} className="text-neutral-700 group-hover:text-white transition-colors" />
                {link.name}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-neutral-600 text-sm font-mono">
              © {currentYear} RonniX Entertainment. {t.navigation.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
