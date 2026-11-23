import React, { useState } from 'react';
import { SPENTA_LOGO_URL } from '../data/spentaManifest';

interface SpentaLogoProps {
  className?: string;
  tone?: 'dark-bg' | 'light-bg';
}

export function SpentaLogo({ className = 'h-8', tone = 'dark-bg' }: SpentaLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 36 36" className="h-full w-auto" aria-hidden="true">
          <rect
            x="2"
            y="2"
            width="32"
            height="32"
            rx="8"
            fill={tone === 'dark-bg' ? '#0D261D' : '#07130F'}
            stroke="#1EB56A"
            strokeWidth="2"
          />
          <path
            d="M11 23 C11 14, 18 10, 26 11 C25 19, 20 25, 11 23 Z"
            fill="#1EB56A"
            fillOpacity="0.25"
            stroke="#1EB56A"
            strokeWidth="2"
          />
          <path d="M12 22 L22 14" stroke="#6EE7B7" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="14" r="2.2" fill="#1EB56A" />
        </svg>
        <span
          className={`font-extrabold tracking-tight text-base ${
            tone === 'dark-bg' ? 'text-white' : 'text-[#07130F]'
          }`}
        >
          spenta
        </span>
      </span>
    );
  }

  return (
    <img
      src={SPENTA_LOGO_URL}
      alt="Spenta Technology"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${className} w-auto object-contain ${
        tone === 'dark-bg' ? 'brightness-110' : ''
      }`}
    />
  );
}
