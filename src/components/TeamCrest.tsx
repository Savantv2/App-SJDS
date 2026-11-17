import { useState } from 'react';
import type { CrestMotif } from '../types/league';

interface TeamCrestProps {
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  motif: CrestMotif;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<TeamCrestProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

export function TeamCrest({
  name,
  shortName,
  primaryColor,
  secondaryColor,
  motif,
  logoUrl,
  size = 'md',
}: TeamCrestProps) {
  const [imgError, setImgError] = useState(false);
  const dimClass = SIZE_CLASSES[size];

  if (logoUrl && !imgError) {
    return (
      <div
        className={`${dimClass} shrink-0 rounded-lg overflow-hidden border border-white/15 bg-[#121215] flex items-center justify-center`}
      >
        <img
          src={logoUrl}
          alt={`Escudo de ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${dimClass} shrink-0`}
      role="img"
      aria-label={`Escudo de ${name}`}
    >
      <defs>
        <linearGradient id={`grad-${shortName}-${motif}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
      </defs>
      <path
        d="M10 10 L32 4 L54 10 L54 32 C54 46 42 56 32 60 C22 56 10 46 10 32 Z"
        fill={`url(#grad-${shortName}-${motif})`}
        stroke={primaryColor}
        strokeWidth="3"
      />
      <path
        d="M15 14 L32 9 L49 14 L49 31 C49 42 40 50 32 54 C24 50 15 42 15 31 Z"
        fill="none"
        stroke={primaryColor}
        strokeOpacity="0.3"
        strokeWidth="1.2"
      />
      {motif === 'shark' && (
        <path
          d="M21 38 C25 27 33 20 41 18 C38 25 38 32 43 38 Z"
          fill={primaryColor}
          fillOpacity="0.28"
        />
      )}
      {motif === 'wave' && (
        <path
          d="M17 36 Q24 27 32 35 T47 33 L47 41 L17 41 Z"
          fill={primaryColor}
          fillOpacity="0.28"
        />
      )}
      {motif === 'sun' && (
        <circle cx="32" cy="27" r="9" fill={primaryColor} fillOpacity="0.28" />
      )}
      {motif === 'crown' && (
        <path
          d="M20 35 L22 22 L28 28 L32 20 L36 28 L42 22 L44 35 Z"
          fill={primaryColor}
          fillOpacity="0.28"
        />
      )}
      {motif === 'flame' && (
        <path
          d="M32 17 C38 24 41 31 37 38 C34 42 29 42 26 37 C23 31 27 23 32 17 Z"
          fill={primaryColor}
          fillOpacity="0.28"
        />
      )}
      {motif === 'star' && (
        <polygon
          points="32,16 35,25 45,25 37,31 40,40 32,34 24,40 27,31 19,25 29,25"
          fill={primaryColor}
          fillOpacity="0.28"
        />
      )}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#F5F5F4"
        fontSize="14"
        fontWeight="700"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1"
      >
        {shortName.slice(0, 3)}
      </text>
    </svg>
  );
}
