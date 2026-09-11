import React from 'react'

export function LogoIcon({ className = "h-9 w-auto", useImage = false }) {
  if (useImage) {
    return (
      <img
        src="/logoidea.jpeg"
        alt="FundX Logo"
        className={`${className} object-contain rounded-lg`}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="fundxNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a192f" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="fundxEmeraldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      <path
        d="M 20 25 C 20 15, 30 10, 45 10 L 125 10 C 135 10, 140 18, 135 28 C 130 38, 120 42, 110 42 L 50 42 C 40 42, 35 48, 30 55 L 20 70 Z"
        fill="url(#fundxNavyGrad)"
      />
      <path
        d="M 20 75 C 20 62, 30 55, 45 55 L 115 55 C 122 55, 126 62, 120 70 L 65 140 C 58 150, 45 155, 35 150 L 22 142 C 15 137, 15 125, 20 115 Z"
        fill="url(#fundxNavyGrad)"
      />
      <path
        d="M 45 170 C 40 170, 35 165, 40 155 L 75 110 L 105 138 L 70 170 Z"
        fill="url(#fundxEmeraldGrad)"
      />
      <path
        d="M 85 95 L 155 18 C 158 14, 164 14, 168 18 L 180 30 C 184 34, 184 40, 180 44 L 118 115 Z"
        fill="url(#fundxEmeraldGrad)"
      />
      <polygon
        points="140,5 195,5 195,60"
        fill="url(#fundxEmeraldGrad)"
      />
    </svg>
  )
}

export default function Logo({
  showText = true,
  size = "md",
  useImage = true,
  textColor = "text-white",
  className = ""
}) {
  const sizeClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
    xl: "h-16"
  }

  const textSizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  }

  const iconClass = `${sizeClasses[size] || sizeClasses.md} w-auto transition-transform duration-200 group-hover:scale-105`

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logoidea.jpeg"
        alt="FundX"
        className={`${iconClass} object-contain rounded-md shadow-2xs`}
      />
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-tight ${textSizeClasses[size] || textSizeClasses.md} font-poppins ${textColor} leading-none`}>
            FUND<span className="text-emerald-400">X</span>
          </span>
        </div>
      )}
    </div>
  )
}
