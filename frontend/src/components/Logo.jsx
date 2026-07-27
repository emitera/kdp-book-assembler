import React from 'react';

export default function Logo({ size = 'medium', className = '' }) {
  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      {/* Brand Logo Image */}
      <img
        src="/logo.jpg"
        alt="Birdy Pages Logo"
        className="h-10 md:h-12 w-auto object-contain transition-all"
        onError={(e) => {
          // Fallback if image fails to render
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Subtitle matching brand style without parentheses */}
      <span className="text-[11px] md:text-xs font-medium tracking-wide text-slate-600 dark:text-slate-400 mt-0.5 font-sans">
        Smart book Assembler for KDP
      </span>
    </div>
  );
}
