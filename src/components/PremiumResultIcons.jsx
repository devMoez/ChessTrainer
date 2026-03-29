import React from 'react';

function Svg({ children, className, title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function CrownIcon({ className, title = 'Winner' }) {
  return (
    <Svg className={className} title={title}>
      <path
        d="M4.5 10.5 7.5 7.5 12 13 16.5 6.5 20 10.5 19 18.5H5.5L4.5 10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 18.6h11.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="7.6" r="1.1" fill="currentColor" />
      <circle cx="12" cy="13" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="6.6" r="1.1" fill="currentColor" />
      <circle cx="20" cy="10.6" r="1.1" fill="currentColor" />
    </Svg>
  );
}

export function BrokenCrownIcon({ className, title = 'Defeat' }) {
  return (
    <Svg className={className} title={title}>
      <path
        d="M4.5 10.5 7.5 7.5 10.8 11.6 12 13 16.5 6.5 20 10.5 19 18.5H5.5L4.5 10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 7.2 10.8 11.6 14 12.8 12.6 16.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 18.6h11.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HourglassIcon({ className, title = 'Timeout' }) {
  return (
    <Svg className={className} title={title}>
      <path
        d="M8 3.5h8M8 20.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 3.6v4.1c0 1.2.6 2.3 1.6 3L12 12l1.4 1.3c1 .8 1.6 1.9 1.6 3v4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 8.6h5.2M9.4 15.4h5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </Svg>
  );
}

export function WhiteFlagIcon({ className, title = 'Resignation' }) {
  return (
    <Svg className={className} title={title}>
      <path
        d="M6.5 3.5v17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.2 4.2c2.2-1.1 4.5-.9 6.7.7 1.8 1.3 3.3 1.6 4.6.9v7.3c-1.6.9-3.3.6-5.2-.7-2-1.4-4.1-1.7-6.1-.8V4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DrawEmblemIcon({ className, title = 'Draw' }) {
  return (
    <Svg className={className} title={title}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.9"
      />
      <path
        d="M8.5 10.2h7M8.5 13.8h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.9 17.2 17.1 6.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </Svg>
  );
}

