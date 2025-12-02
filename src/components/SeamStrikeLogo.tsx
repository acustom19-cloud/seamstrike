import React from 'react';

interface SeamStrikeLogoProps {
  className?: string;
  sport?: 'Baseball' | 'Softball';
}

const SeamStrikeLogo: React.FC<SeamStrikeLogoProps> = ({ className = "w-8 h-8", sport = 'Baseball' }) => {
  const isSoftball = sport === 'Softball';
  const fillColor = isSoftball ? '#eaff00' : 'white'; // Optic Yellow

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* Drop Shadow Definition */}
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Diamond Shape Background */}
      <path 
        d="M50 90 L90 50 L50 10 L10 50 Z" 
        fill={fillColor}
        stroke="#4f46e5" 
        strokeWidth="4" 
        strokeLinejoin="round"
        filter="url(#shadow)"
      />

      {/* Seams - Left Side */}
      <path 
        d="M32 32 C 45 42, 45 58, 32 68" 
        stroke="#ef4444" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeDasharray="0"
      />
      {/* Stitches Left */}
      <path d="M30 36 L 38 34" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 44 L 40 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 56 L 40 58" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 64 L 38 66" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

      {/* Seams - Right Side */}
      <path 
        d="M68 32 C 55 42, 55 58, 68 68" 
        stroke="#ef4444" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeDasharray="0"
      />
      {/* Stitches Right */}
      <path d="M70 36 L 62 34" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 44 L 60 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 56 L 60 58" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 64 L 62 66" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default SeamStrikeLogo;