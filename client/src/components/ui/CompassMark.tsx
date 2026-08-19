interface CompassMarkProps {
  size?: number;
  className?: string;
}

export function CompassMark({ size = 28, className }: CompassMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14.2" stroke="url(#cm-ring)" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="9.4" stroke="#1b2a44" strokeWidth="1" />
      {/* cardinal ticks */}
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="16"
          y1="2.4"
          x2="16"
          y2="4.8"
          stroke="#8ca4c8"
          strokeWidth="1.2"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      {/* N needle */}
      <path
        d="M16 6.8 L18.6 17.6 L16 25.2 L13.4 17.6 Z"
        fill="url(#cm-needle)"
      />
      <circle cx="16" cy="17.6" r="1.6" fill="#04070d" />
      <circle cx="16" cy="17.6" r="0.7" fill="#f7b85e" />
      <defs>
        <linearGradient id="cm-needle" x1="16" y1="6.8" x2="16" y2="25.2">
          <stop offset="0%" stopColor="#5ad8ff" />
          <stop offset="100%" stopColor="#1782ad" />
        </linearGradient>
        <linearGradient id="cm-ring" x1="2" y1="2" x2="30" y2="30">
          <stop offset="0%" stopColor="#5ad8ff" />
          <stop offset="55%" stopColor="#2fc3ef" />
          <stop offset="100%" stopColor="#1782ad" />
        </linearGradient>
      </defs>
    </svg>
  );
}