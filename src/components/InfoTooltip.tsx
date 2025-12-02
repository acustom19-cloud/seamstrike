
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'center' | 'right';
  side?: 'top' | 'bottom';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  text, 
  size = 'sm', 
  align = 'center', 
  side = 'top' 
}) => {
  
  // Determine alignment (X-axis)
  let alignClass = "left-1/2 -translate-x-1/2"; // Default center
  if (align === 'left') alignClass = "left-0 -translate-x-0";
  if (align === 'right') alignClass = "right-0 translate-x-0";

  // Determine side (Y-axis)
  let sideClass = "bottom-full mb-2"; // Default top (appears above)
  let arrowSideClass = "top-full border-t-slate-800"; // Arrow points down
  
  if (side === 'bottom') {
    sideClass = "top-full mt-2"; // Appears below
    arrowSideClass = "bottom-full border-b-slate-800 border-t-transparent"; // Arrow points up
  }

  // Arrow alignment logic
  let arrowAlignClass = "left-1/2 -translate-x-1/2";
  if (align === 'left') arrowAlignClass = "left-2";
  if (align === 'right') arrowAlignClass = "right-2";

  return (
    <div className="group relative inline-flex items-center ml-1.5 cursor-help align-middle z-10">
      <HelpCircle className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-slate-400 hover:text-indigo-500 transition-colors`} />
      
      <div 
        className={`absolute ${sideClass} ${alignClass} w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed`}
      >
        {text}
        <div className={`absolute ${arrowSideClass} ${arrowAlignClass} border-4 border-transparent`}></div>
      </div>
    </div>
  );
};

export default InfoTooltip;
