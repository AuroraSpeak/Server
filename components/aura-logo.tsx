interface AuraLogoProps {
  size?: number
  className?: string
}

export default function AuraLogo({ size = 40, className = "" }: AuraLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Outer glow effect */}
        <defs>
          <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(264, 73%, 65%)" stopOpacity="0.8" />
            <stop offset="70%" stopColor="hsl(264, 73%, 65%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(264, 73%, 65%)" stopOpacity="0" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background glow */}
        <circle cx="50" cy="50" r="45" fill="url(#auraGlow)" filter="url(#glow)" />

        {/* Main hexagon shape */}
        <path
          d="M50 15L85 35V65L50 85L15 65V35L50 15Z"
          fill="hsl(236, 17%, 12%)"
          stroke="hsl(264, 73%, 65%)"
          strokeWidth="2"
        />

        {/* Sound wave elements */}
        <path d="M50 35V65" stroke="hsl(195, 83%, 60%)" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 40V60" stroke="hsl(195, 83%, 60%)" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 40V60" stroke="hsl(195, 83%, 60%)" strokeWidth="3" strokeLinecap="round" />

        {/* Outer sound waves */}
        <path d="M30 45V55" stroke="hsl(264, 73%, 65%)" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 45V55" stroke="hsl(264, 73%, 65%)" strokeWidth="3" strokeLinecap="round" />

        {/* Letter A stylized */}
        <path d="M50 30L60 70H40L50 30Z" fill="none" stroke="hsl(0, 0%, 100%)" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      {/* Additional glow effect using CSS */}
      <div
        className="absolute inset-0 rounded-full bg-[hsl(264,73%,65%)] opacity-20 blur-md animate-pulse"
        style={{
          animationDuration: "3s",
          animationIterationCount: "infinite",
          animationDirection: "alternate",
        }}
      />
    </div>
  )
}

