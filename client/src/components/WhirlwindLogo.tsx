import type { SVGProps } from 'react';

interface WhirlwindLogoProps extends SVGProps<SVGSVGElement> {
  showText?: boolean;
}

export default function WhirlwindLogo({ showText = false, ...props }: WhirlwindLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? '0 0 140 32' : '0 0 32 32'}
      fill="none"
      {...props}
    >
      <path
        d="M16 4C20 4 26 6 26 10C26 13 22 14 19 13.5C16 13 14 11 16 9C18 7 22 8 22 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 28C12 28 6 26 6 22C6 19 10 18 13 18.5C16 19 18 21 16 23C14 25 10 24 10 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 16C4 12 6 6 10 6C13 6 14 10 13.5 13C13 16 11 18 9 16C7 14 8 10 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 16C28 20 26 26 22 26C19 26 18 22 18.5 19C19 16 21 14 23 16C25 18 24 22 22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      {showText && (
        <text
          x="34"
          y="22"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="18"
        >
          Typephoon
        </text>
      )}
    </svg>
  );
}
