
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('ronnix_hero_shown');
    if (!hasSeenIntro) {
      setShouldAnimate(true);
      sessionStorage.setItem('ronnix_hero_shown', 'true');
    }
  }, []);

  return (
    <header className="relative pt-20 pb-12 px-6 bg-gradient-to-b from-black via-neutral-900/10 to-neutral-950 overflow-hidden flex flex-col items-center justify-center min-h-[60vh]">
      <div className="container mx-auto relative z-10 flex flex-col items-center w-full max-w-6xl">
        
        {/* 1. BRANDING: Logo/Image */}
        <div className={`mx-auto mb-8 w-full max-w-4xl relative flex items-center justify-center ${shouldAnimate ? 'animate-fade-in' : ''}`}>
             <img 
                src="./images/RonniX.png" 
                alt="RonniX Main" 
                className="relative z-10 w-full h-auto max-h-[280px] md:max-h-[400px] object-contain drop-shadow-[0_0_35px_rgba(186,230,253,0.3)]"
             />
        </div>

        {/* 2. SLOGAN */}
        <h1 className={`font-retro text-2xl md:text-5xl text-white text-center max-w-4xl leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,1)] ${shouldAnimate ? 'animate-slide-up' : ''}`}>
          {t.home.hero.titleStart} <br className="hidden lg:block"/>
          <span className="bg-gradient-to-b from-white via-gray-200 to-neutral-400 bg-clip-text text-transparent inline-block pb-2 pr-2">
            RonniX Entertainment
          </span>
        </h1>

      </div>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40 pointer-events-none">
          {/* Hellblau-weißes Leuchten (Sky-200/10) */}
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-sky-200/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-neutral-800/20 rounded-full blur-[150px]"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>
    </header>
  );
};
