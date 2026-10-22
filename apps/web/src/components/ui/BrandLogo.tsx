import React from 'react';
import Image from 'next/image';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  emblemClassName?: string;
  forceWhite?: boolean;
  priority?: boolean;
}

export function BrandLogo({
  className = '',
  size = 'md',
  showWordmark = false,
  wordmarkClassName = '',
  emblemClassName = '',
  forceWhite = false,
  priority = false,
}: BrandLogoProps) {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 28
      : size === 'lg'
      ? 48
      : size === 'xl'
      ? 56
      : 40;

  const wordmarkSizeClass =
    typeof size === 'number'
      ? 'text-base sm:text-lg'
      : size === 'sm'
      ? 'text-xs sm:text-sm tracking-[0.2em]'
      : size === 'lg'
      ? 'text-xl sm:text-2xl tracking-[0.25em]'
      : size === 'xl'
      ? 'text-2xl sm:text-3xl tracking-[0.28em]'
      : 'text-base sm:text-xl tracking-[0.22em]';

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* 3D Animated Rotating Logo Emblem — Authentic Alpha Transparency */}
      <span
        className={`relative inline-flex items-center justify-center shrink-0 ${emblemClassName}`}
        style={{ width: pixelSize, height: pixelSize }}
        aria-hidden="true"
      >
        <Image
          src="/brand/xydv-logo-nobg.webp"
          alt="XYDV"
          width={pixelSize}
          height={pixelSize}
          unoptimized
          priority={priority}
          className={`w-full h-full object-contain object-center select-none ${
            forceWhite ? 'brightness-110' : 'dark:brightness-110'
          }`}
        />
      </span>

      {/* Brand Wordmark (only if explicitly enabled, hidden by default per user request) */}
      {showWordmark && (
        <span
          className={`font-montserrat font-bold uppercase leading-none transition-colors ${wordmarkSizeClass} ${wordmarkClassName}`}
        >
          XYDV
        </span>
      )}
    </div>
  );
}

export function BrandEmblem({
  size = 40,
  className = '',
  forceWhite = false,
}: {
  size?: number;
  className?: string;
  forceWhite?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/brand/xydv-logo-nobg.webp"
        alt="XYDV Emblem"
        width={size}
        height={size}
        unoptimized
        className={`w-full h-full object-contain object-center select-none ${
          forceWhite ? 'brightness-110' : 'dark:brightness-110'
        }`}
      />
    </span>
  );
}
