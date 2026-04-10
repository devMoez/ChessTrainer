import React, { useRef, useEffect, useState } from 'react';
import { daysAgo, ringProgress, nextMilestone, masteryColor } from '../hooks/useOpeningLines.js';
import './lines.css';

// ── SVG progress ring constants ───────────────────────────────
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 163.4

/**
 * RepetitionCounter — shows training frequency, progress ring, and +1 Rep button.
 *
 * @param {object}   stats       - { repetitions, lastTrained, masteryScore }
 * @param {Function} onIncrement - () => void  — called when +1 Rep is clicked
 * @param {boolean}  [isReady]   - Highlight the button when line is finished
 */
export default function RepetitionCounter({ stats, onIncrement, isReady = false }) {
  const { repetitions = 0, lastTrained = null, masteryScore = 0 } = stats ?? {};

  const progress = ringProgress(repetitions);
  const toNext = nextMilestone(repetitions);
  const ringColor = masteryColor(masteryScore);
  const offset = CIRCUMFERENCE * (1 - progress);
  const lastStr = daysAgo(lastTrained);

  // Flash effect on milestone hit
  const [flash, setFlash] = useState(false);
  const prevReps = useRef(repetitions);

  useEffect(() => {
    const prev = prevReps.current;
    prevReps.current = repetitions;

    // Check if we just crossed a milestone (10, 20, 50, 100)
    const milestones = [10, 20, 50, 100];
    const crossedMilestone = milestones.some(m => prev < m && repetitions >= m);
    if (crossedMilestone) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [repetitions]);

  return (
    <div className={`rc-wrap${flash ? ' rc-milestone-flash' : ''}`}>

      {/* Ring + stats row */}
      <div className="rc-header">

        {/* Progress ring */}
        <div className="rc-ring-wrap" aria-hidden="true">
          <svg className="rc-ring-svg" viewBox="0 0 64 64">
            {/* Background track */}
            <circle
              className="rc-ring-bg"
              cx="32" cy="32" r={RADIUS}
            />
            {/* Filled arc */}
            <circle
              className="rc-ring-fill"
              cx="32" cy="32" r={RADIUS}
              style={{
                stroke: ringColor,
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: offset,
              }}
            />
          </svg>

          {/* Count inside ring */}
          <div className="rc-ring-count" style={{ color: ringColor }}>
            <span>{repetitions}</span>
            <span className="rc-ring-label">reps</span>
          </div>
        </div>

        {/* Text stats */}
        <div className="rc-stats">
          <div className="rc-stat-line">
            Trained <strong>{repetitions}×</strong>
          </div>
          <div className="rc-stat-line">
            Mastery:{' '}
            <strong style={{ color: ringColor }}>{masteryScore}%</strong>
          </div>
          {lastStr && (
            <div className="rc-stat-line">
              Last: <strong>{lastStr}</strong>
            </div>
          )}
          {toNext !== null ? (
            <div className="rc-milestone">
              {toNext} more to next milestone
            </div>
          ) : (
            <div className="rc-milestone" style={{ color: 'var(--accent-gold)' }}>
              ★ Master level!
            </div>
          )}
        </div>
      </div>

      {/* +1 Rep button — highlighted when line is finished */}
      <button
        className={`rc-rep-btn${isReady ? ' rc-rep-btn-ready' : ''}`}
        onClick={onIncrement}
        title="Press R to add a repetition"
      >
        +1 Rep
        {isReady && <span style={{ fontSize: 12, opacity: 0.8 }}>(line complete)</span>}
      </button>

    </div>
  );
}
