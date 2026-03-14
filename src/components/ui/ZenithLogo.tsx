import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

// ═══════════════════════════════════════════════════════════════
//  ZENITH Official Logo Component
//  Uses the uploaded crystalline cyan Z logo image.
//  NEVER replace with a different logo.
//  NEVER use text or emoji as substitute.
// ═══════════════════════════════════════════════════════════════

interface ZenithLogoProps {
  // Image-only variant shows just the crystalline Z
  variant?: 'icon' | 'full' | 'stacked'
  // Sizes
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  // Additional class
  className?: string
  // Whether to show the ZENITH wordmark beside the logo
  showText?: boolean
  // Priority loading (for above-fold logos)
  priority?: boolean
}

const ICON_SIZES = {
  xs:  24,
  sm:  32,
  md:  48,
  lg:  64,
  xl:  96,
  '2xl': 128,
}

const TEXT_SIZES = {
  xs:  'text-sm',
  sm:  'text-base',
  md:  'text-xl',
  lg:  'text-2xl',
  xl:  'text-3xl',
  '2xl': 'text-4xl',
}

export function ZenithLogo({
  variant = 'full',
  size = 'md',
  className,
  showText = true,
  priority = false,
}: ZenithLogoProps) {
  const iconSize = ICON_SIZES[size]
  const textSize = TEXT_SIZES[size]

  if (variant === 'icon') {
    return (
      <div className={cn('relative flex-shrink-0', className)}>
        <Image
          src="/images/logo.png"
          alt="ZENITH"
          width={iconSize}
          height={iconSize}
          priority={priority}
          className="object-contain drop-shadow-[0_0_12px_rgba(0,245,255,0.6)]"
          style={{ filter: 'drop-shadow(0 0 12px var(--color-primary-glow))' }}
        />
      </div>
    )
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Image
          src="/images/logo.png"
          alt="ZENITH"
          width={iconSize * 1.5}
          height={iconSize * 1.5}
          priority={priority}
          className="object-contain"
          style={{ filter: 'drop-shadow(0 0 20px var(--color-primary-glow))' }}
        />
        {showText && (
          <span
            className={cn(
              'font-display font-black tracking-[0.3em] text-glow',
              textSize
            )}
          >
            ZENITH
          </span>
        )}
      </div>
    )
  }

  // Default: full (icon + text side by side)
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/images/logo.png"
        alt="ZENITH"
        width={iconSize}
        height={iconSize}
        priority={priority}
        className="object-contain flex-shrink-0"
        style={{ filter: 'drop-shadow(0 0 10px var(--color-primary-glow))' }}
      />
      {showText && (
        <span
          className={cn(
            'font-display font-black tracking-[0.25em] text-glow',
            textSize
          )}
        >
          ZENITH
        </span>
      )}
    </div>
  )
}
