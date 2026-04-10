import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import './lines.css';

/**
 * LineNavigator — Previous / counter / Next control for browsing lines.
 *
 * @param {number}   selectedIdx  - 0-based current index
 * @param {number}   total        - Total number of lines
 * @param {Function} onPrev       - () => void
 * @param {Function} onNext       - () => void
 * @param {boolean}  isFirst      - Disable prev when true
 * @param {boolean}  isLast       - Disable next when true
 */
export default function LineNavigator({ selectedIdx, total, onPrev, onNext, isFirst, isLast }) {
  if (total <= 1) return null; // no point showing nav for a single line

  return (
    <div className="ln-wrap">
      <button
        className="ln-btn"
        onClick={onPrev}
        disabled={isFirst}
        title="Previous line (←)"
        aria-label="Previous line"
      >
        <HiChevronLeft size={16} />
      </button>

      <span className="ln-counter" aria-live="polite">
        {selectedIdx + 1} / {total}
      </span>

      <button
        className="ln-btn"
        onClick={onNext}
        disabled={isLast}
        title="Next line (→)"
        aria-label="Next line"
      >
        <HiChevronRight size={16} />
      </button>
    </div>
  );
}
