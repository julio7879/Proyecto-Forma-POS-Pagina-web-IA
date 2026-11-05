import React, { useId } from 'react';

export type FormaLogoVariant = 'full' | 'horizontal' | 'icon' | 'badge';
export type FormaLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FormaLogoTheme = 'light' | 'dark' | 'monochrome';

export interface FormaLogoProps {
  /**
   * Variante estructural del logo:
   * - 'full': Isotipo + FORMA + Subtítulo sastre vertical centrado.
   * - 'horizontal': Isotipo al lado de FORMA y subtítulo (default).
   * - 'icon': Solo el monograma 'F' con aguja de oro y hebra de seda.
   * - 'badge': Píldora editorial para encabezados de lujo.
   */
  variant?: FormaLogoVariant;
  /** Escala dimensional del logotipo */
  size?: FormaLogoSize;
  /** Paleta temática según el fondo */
  theme?: FormaLogoTheme;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Mostrar u ocultar el subtítulo sastre en variantes textuales */
  showSubtitle?: boolean;
}

/**
 * Componente SVG del Isotipo Monograma:
 * - Estructura arquitectónica 'F' de alta costura.
 * - Aguja de coser en Oro Champán (#D19650) en ángulo ascendente de 45°.
 * - Hebra fluida de seda en Vinotinto Imperial (#661521 / #8B1E2F).
 * - Ojo de aguja con destello especular.
 */
interface MonogramIconProps {
  sizeClass: string;
  theme: FormaLogoTheme;
  uniqueId: string;
}

const MonogramIcon: React.FC<MonogramIconProps> = ({ sizeClass, theme, uniqueId }) => {
  const isMonochrome = theme === 'monochrome';
  const isLight = theme === 'light';

  // Colores del monograma arquitectónico 'F'
  const fFill = isMonochrome ? '#000000' : isLight ? '#1C1311' : '#FAF6F0';

  // Colores de la aguja y la seda
  const needleFill = isMonochrome ? '#000000' : `url(#forma-gold-${uniqueId})`;
  const silkStroke = isMonochrome ? '#000000' : `url(#forma-silk-${uniqueId})`;
  const eyeBg = isMonochrome ? '#FFFFFF' : isLight ? '#E7DED2' : '#1C1311';
  const gleamFill = isMonochrome ? '#000000' : '#FFF9EC';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 select-none overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        {!isMonochrome && (
          <>
            {/* Degradado Oro Champán Metálico */}
            <linearGradient
              id={`forma-gold-${uniqueId}`}
              x1="16"
              y1="84"
              x2="84"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#9B6826" />
              <stop offset="25%" stopColor="#D19650" />
              <stop offset="60%" stopColor="#F9E8C7" />
              <stop offset="85%" stopColor="#D19650" />
              <stop offset="100%" stopColor="#FFECC7" />
            </linearGradient>

            {/* Degradado Seda Vinotinto Imperial */}
            <linearGradient
              id={`forma-silk-${uniqueId}`}
              x1="22"
              y1="88"
              x2="88"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4A0E18" />
              <stop offset="35%" stopColor="#661521" />
              <stop offset="70%" stopColor="#8B1E2F" />
              <stop offset="100%" stopColor="#B32B40" />
            </linearGradient>

            {/* Sombra sutil para la aguja de oro */}
            <filter
              id={`forma-needle-glow-${uniqueId}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1.5"
                floodColor="#D19650"
                floodOpacity="0.35"
              />
            </filter>
          </>
        )}
      </defs>

      {/* 1. Hebra de seda (Lazo trasero que envuelve el tallo de la F) */}
      <path
        d="M 88 36 C 85 28, 79 24, 73 25 C 65 26, 56 34, 46 44 C 36 54, 28 58, 22 52 C 16 46, 18 36, 24 28 C 30 20, 40 18, 50 20"
        stroke={silkStroke}
        strokeWidth={isMonochrome ? '2.5' : '3.2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={isMonochrome ? '0.75' : '0.85'}
      />

      {/* 2. Monograma 'F' Arquitectónico Sastre */}
      <path
        d="M 28 18 H 74 V 30 H 42 V 44 H 64 V 55 H 42 V 82 H 28 Z"
        fill={fFill}
      />

      {/* 3. Aguja de Coser en Oro Champán (atraviesa en diagonal ascendente) */}
      <g filter={!isMonochrome ? `url(#forma-needle-glow-${uniqueId})` : undefined}>
        {/* Cuerpo / Hoja afilada de la aguja con ojo superior */}
        <path
          d="M 16 84 L 69 31 C 71 29, 73 25, 77 21 C 80.5 17.5, 84 19, 82 23 C 78 27, 74 30, 71 33 L 18 86 Z"
          fill={needleFill}
        />

        {/* Ojo de la aguja (apertura elíptica diagonal) */}
        <ellipse
          cx="75"
          cy="25"
          rx="1.5"
          ry="4"
          transform="rotate(45 75 25)"
          fill={eyeBg}
        />
      </g>

      {/* 4. Hebra de seda delantera (entra y sale del ojo de la aguja, cayendo con gracia) */}
      <path
        d="M 75 25 C 73 30, 68 36, 58 46 C 48 56, 42 66, 38 76 C 34 86, 28 92, 22 90"
        stroke={silkStroke}
        strokeWidth={isMonochrome ? '2.5' : '3.5'}
        strokeLinecap="round"
        fill="none"
      />

      {/* 5. Destello Especular en el Ojo de la Aguja */}
      {!isMonochrome && (
        <path
          d="M 81 15 L 82.5 19 L 86.5 20.5 L 82.5 22 L 81 26 L 79.5 22 L 75.5 20.5 L 79.5 19 Z"
          fill={gleamFill}
          opacity="0.95"
        />
      )}
    </svg>
  );
};

export const FormaLogo: React.FC<FormaLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'dark',
  className = '',
  showSubtitle = true,
}) => {
  const rawId = useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const isLight = theme === 'light';
  const isMonochrome = theme === 'monochrome';

  // Configuración de tamaños para el Isotipo
  const iconSizeMap: Record<FormaLogoSize, string> = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // Configuración tipográfica para FORMA
  const wordmarkSizeMap: Record<FormaLogoSize, string> = {
    xs: 'text-xs tracking-[0.2em]',
    sm: 'text-sm tracking-[0.22em]',
    md: 'text-base sm:text-lg tracking-[0.25em]',
    lg: 'text-xl sm:text-2xl tracking-[0.25em]',
    xl: 'text-3xl sm:text-4xl tracking-[0.28em]',
  };

  // Configuración tipográfica para el subtítulo sastre
  const subtitleSizeMap: Record<FormaLogoSize, string> = {
    xs: 'text-[7px] tracking-[0.18em]',
    sm: 'text-[8px] tracking-[0.2em]',
    md: 'text-[9px] sm:text-[10px] tracking-[0.22em]',
    lg: 'text-[11px] sm:text-xs tracking-[0.25em]',
    xl: 'text-xs sm:text-sm tracking-[0.25em]',
  };

  // Colores de texto según tema
  const textColorClass = isMonochrome
    ? 'text-black'
    : isLight
      ? 'text-[#1C1311]'
      : 'text-white';

  const dotColorClass = isMonochrome
    ? 'text-black'
    : 'text-[#D19650]';

  const subtitleColorClass = isMonochrome
    ? 'text-black/80'
    : isLight
      ? 'text-[#6B534C]'
      : 'text-[#D19650]/90';

  // 1. Variante: SOLO ICONO (Monograma)
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        data-testid="forma-logo-icon"
      >
        <MonogramIcon
          sizeClass={iconSizeMap[size]}
          theme={theme}
          uniqueId={uniqueId}
        />
      </div>
    );
  }

  // 2. Variante: BADGE EDITORIAL (Píldora de Lujo)
  if (variant === 'badge') {
    const badgeBgClass = isMonochrome
      ? 'bg-white border-black text-black'
      : isLight
        ? 'bg-[#E7DED2]/80 border-white/90 text-[#1C1311] shadow-inner'
        : 'bg-[#1C1311]/90 border-[#D19650]/40 text-white shadow-sm';

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBgClass} ${className}`}
        data-testid="forma-logo-badge"
      >
        <MonogramIcon
          sizeClass="w-5 h-5"
          theme={theme}
          uniqueId={uniqueId}
        />
        <div className="flex items-center gap-1 font-display leading-none">
          <span className="font-black text-xs tracking-[0.2em]">FORMA</span>
          <span className={dotColorClass}>•</span>
          <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase opacity-90">
            ATELIER
          </span>
        </div>
      </div>
    );
  }

  // 3. Variante: FULL (Vertical Editorial Centrado)
  if (variant === 'full') {
    return (
      <div
        className={`inline-flex flex-col items-center text-center gap-2 select-none ${className}`}
        data-testid="forma-logo-full"
      >
        <MonogramIcon
          sizeClass={iconSizeMap[size]}
          theme={theme}
          uniqueId={uniqueId}
        />
        <div className="flex flex-col items-center">
          <span
            className={`font-display font-black leading-tight ${wordmarkSizeMap[size]} ${textColorClass}`}
          >
            FORMA<span className={dotColorClass}>.</span>
          </span>
          {showSubtitle && (
            <span
              className={`font-sans font-bold uppercase mt-1 ${subtitleSizeMap[size]} ${subtitleColorClass}`}
            >
              COLOMBIA • ATELIER & OMNIPOS
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Variante: HORIZONTAL (Default: Isotipo al lado de FORMA y Subtítulo)
  return (
    <div
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}
      data-testid="forma-logo-horizontal"
    >
      <MonogramIcon
        sizeClass={iconSizeMap[size]}
        theme={theme}
        uniqueId={uniqueId}
      />
      <div className="flex flex-col justify-center min-w-0 leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-display font-black tracking-[0.25em] ${wordmarkSizeMap[size]} ${textColorClass}`}
          >
            FORMA
          </span>
          <span className={`font-black ${wordmarkSizeMap[size]} ${dotColorClass}`}>
            .
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-sans font-bold uppercase mt-1 truncate ${subtitleSizeMap[size]} ${subtitleColorClass}`}
          >
            ATELIER & OMNIPOS
          </span>
        )}
      </div>
    </div>
  );
};

export default FormaLogo;
