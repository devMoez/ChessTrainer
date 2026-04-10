import React from 'react';

/**
 * MoveIndicator
 *
 * Displays a green ✓ or red ✕ circle in the top-right corner of the board.
 *
 * Uses React's `key` prop to force a full remount on every new feedback event —
 * this resets the CSS animation instantly, so consecutive wrong moves each
 * show a fresh indicator with no flicker or stale state.
 *
 * Appears instantly (no fade-in), dismisses after 400 ms (CSS handles it).
 * pointer-events: none ensures it never blocks piece interaction.
 *
 * @param {{ type: 'success'|'error', id: number } | null} feedback
 */
export default function MoveIndicator({ feedback }) {
  if (!feedback) return null;

  const isSuccess = feedback.type === 'success';

  return (
    <div
      key={feedback.id}            // remount on each new feedback → fresh animation
      aria-hidden="true"
      style={{
        position:       'absolute',
        top:            10,
        right:          10,
        zIndex:         200,
        pointerEvents:  'none',    // CRITICAL: never blocks piece drag/drop
        width:          40,
        height:         40,
        borderRadius:   '50%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     isSuccess ? '#10b981' : '#ef4444',
        boxShadow:      isSuccess
          ? '0 2px 12px rgba(16,185,129,0.5)'
          : '0 2px 12px rgba(239,68,68,0.5)',
        animation: 'moveIndicatorOut 0.4s ease-out 0ms forwards',
      }}
    >
      {isSuccess ? <CheckIcon /> : <XIcon />}
    </div>
  );
}

// ── Inline SVG icons — crisp at any size, no external dep ────

function CheckIcon() {
  return (
    <svg
      width="22" height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="22" height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6"  y1="6" x2="18" y2="18" />
    </svg>
  );
}
