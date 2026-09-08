import React from 'react';

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return (
    <h2 className="font-retro text-4xl md:text-5xl text-white mb-12 text-center drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
      {title}
    </h2>
  );
};