import React from 'react';

const SeamStrikeWordmark = ({ className = "h-10 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 420 120" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="varsity-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.3)" />
      </filter>
    </defs>
    
    <text 
      x="50%" 
      y="50%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fill="currentColor" 
      fontSize="80"
      fontFamily="'Yellowtail', cursive"
      filter="url(#varsity-shadow)"
    >
      SeamStrike
    </text>
    
    {/* Baseball Stitch Swoosh */}
    <path 
      d="M 60 90 Q 210 120 360 80" 
      stroke="currentColor" 
      strokeWidth="4" 
      fill="none" 
      opacity="0.8"
    />
    <path d="M 70 95 L 75 88" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 90 98 L 95 91" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 110 100 L 115 93" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 130 102 L 135 95" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 150 103 L 155 96" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 170 103 L 175 96" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 190 102 L 195 95" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 210 100 L 215 93" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 230 98 L 235 91" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 250 95 L 255 88" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 270 92 L 275 85" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 290 88 L 295 81" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <path d="M 310 84 L 315 77" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default SeamStrikeWordmark;