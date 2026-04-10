import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HiChevronDown } from 'react-icons/hi';
import { masteryColor, daysAgo } from '../hooks/useOpeningLines.js';
import './lines.css';

// ── Difficulty badge ──────────────────────────────────────────

function DiffBadge({ difficulty }) {
  if (!difficulty) return null;
  const key = difficulty.toLowerCase();
  const cls = {
    beginner: 'ls-diff-beginner',
    intermediate: 'ls-diff-intermediate',
    advanced: 'ls-diff-advanced',
  }[key] || 'ls-diff-intermediate';
  return (
    <span className={`ls-diff-badge ${cls}`}>{difficulty}</span>
  );
}

// ── Mastery chip ──────────────────────────────────────────────

function MasteryChip({ score }) {
  const color = masteryColor(score);
  return (
    <span className="ls-mastery">
      <span className="ls-mastery-dot" style={{ background: color }} />
      <span style={{ color }}>{score}%</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────

/**
 * LineSelector — dropdown for choosing an opening line (variation).
 *
 * @param {object[]}  lines          - Array of line/variation objects
 * @param {number}    selectedIdx    - Currently selected index
 * @param {Function}  onSelect       - (idx: number) => void
 * @param {Function}  getLineStats   - (lineId: string) => { repetitions, lastTrained, masteryScore }
 * @param {string}    [difficulty]   - Opening-level difficulty fallback
 */
export default function LineSelector({ lines, selectedIdx, onSelect, getLineStats, difficulty }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = useCallback((idx) => {
    onSelect(idx);
    setOpen(false);
  }, [onSelect]);

  if (!lines?.length) return null;

  const selectedLine = lines[selectedIdx];
  const selectedStats = getLineStats(selectedLine?.id);
  const lineDiff = selectedLine?.difficulty || difficulty;

  return (
    <div className="ls-wrap" ref={wrapRef}>
      {/* Trigger button */}
      <button
        className="ls-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="ls-trigger-name">{selectedLine?.name ?? 'Select Line'}</span>
        <span className="ls-trigger-meta">
          {selectedStats.repetitions > 0 && (
            <span className="ls-reps-badge">{selectedStats.repetitions}×</span>
          )}
          <MasteryChip score={selectedStats.masteryScore} />
          <DiffBadge difficulty={lineDiff} />
        </span>
        <HiChevronDown className={`ls-chevron${open ? ' ls-chevron-open' : ''}`} />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="ls-list" role="listbox">
          {lines.map((line, idx) => {
            const stats = getLineStats(line.id);
            const diff = line.difficulty || difficulty;
            const last = daysAgo(stats.lastTrained);
            const isActive = idx === selectedIdx;
            return (
              <button
                key={line.id}
                role="option"
                aria-selected={isActive}
                className={`ls-option${isActive ? ' ls-option-active' : ''}`}
                onClick={() => handleSelect(idx)}
              >
                <div className="ls-option-left">
                  <div className="ls-option-name">{line.name}</div>
                  <div className="ls-option-sub">
                    {last ? `Last: ${last}` : 'Never practiced'}
                  </div>
                </div>
                <div className="ls-option-right">
                  <MasteryChip score={stats.masteryScore} />
                  <DiffBadge difficulty={diff} />
                  {stats.repetitions > 0 && (
                    <span className="ls-reps-badge">{stats.repetitions}×</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
