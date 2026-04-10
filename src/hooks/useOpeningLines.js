import { useState, useCallback, useMemo } from 'react';

// ── localStorage helpers ──────────────────────────────────────

const STORAGE_PREFIX = 'opening-';

function loadStorage(openingId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${openingId}`);
    return raw ? JSON.parse(raw) : { lineStats: {}, selectedLineId: null };
  } catch {
    return { lineStats: {}, selectedLineId: null };
  }
}

function saveStorage(openingId, data) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${openingId}`, JSON.stringify(data));
  } catch {
    // storage quota — fail silently
  }
}

// ── Default stats shape for a line ───────────────────────────

function defaultStats() {
  return { repetitions: 0, lastTrained: null, masteryScore: 0 };
}

// ── Mastery colour coding ─────────────────────────────────────

export function masteryColor(score) {
  if (score >= 76) return 'var(--accent-green)';
  if (score >= 50) return '#F6C142';
  return 'var(--accent-red)';
}

// ── Days-ago helper ───────────────────────────────────────────

export function daysAgo(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ── Progress ring: milestones 10 / 20 / 50 / 100 ─────────────

const TIERS = [10, 20, 50, 100];

export function ringProgress(reps) {
  for (let i = 0; i < TIERS.length; i++) {
    const low = i === 0 ? 0 : TIERS[i - 1];
    const high = TIERS[i];
    if (reps < high) return (reps - low) / (high - low);
  }
  return 1;
}

export function nextMilestone(reps) {
  const tier = TIERS.find(t => reps < t);
  if (!tier) return null;
  return tier - reps;
}

// ── Main hook ─────────────────────────────────────────────────

/**
 * useOpeningLines(opening)
 *
 * Manages line selection, rep tracking, and localStorage persistence
 * for a single opening's variations (lines).
 *
 * @param {object} opening  - Full opening object from data/openings.js
 * @returns {object}        - All state and actions needed by the UI
 */
export function useOpeningLines(opening) {
  // Build canonical lines array from variations or create single default
  const lines = useMemo(() => {
    if (opening?.variations?.length) return opening.variations;
    return [{
      id: `${opening?.id ?? 'unknown'}-main`,
      name: 'Main Line',
      moves: opening?.moves ?? '',
      fen: opening?.fen ?? '',
      description: opening?.description ?? '',
      difficulty: opening?.difficulty ?? 'Intermediate',
      isMain: true,
    }];
  }, [opening]);

  // Load persisted state (runs once on mount per opening id)
  const [storage, setStorage] = useState(() => loadStorage(opening?.id));

  // Derive initial index from persisted selectedLineId
  const initialIdx = useMemo(() => {
    if (!storage.selectedLineId) return 0;
    const idx = lines.findIndex(l => l.id === storage.selectedLineId);
    return idx >= 0 ? idx : 0;
  }, []); // intentionally run only once

  const [selectedLineIdx, setSelectedLineIdx] = useState(initialIdx);

  const selectedLine = lines[selectedLineIdx] ?? lines[0];

  // ── Internal storage updater (also persists to localStorage) ─

  const updateStorage = useCallback((updater) => {
    setStorage(prev => {
      const next = updater(prev);
      saveStorage(opening?.id, next);
      return next;
    });
  }, [opening?.id]);

  // ── Stat accessors ────────────────────────────────────────────

  const getLineStats = useCallback((lineId) => {
    return storage.lineStats[lineId] ?? defaultStats();
  }, [storage.lineStats]);

  const selectedLineStats = getLineStats(selectedLine?.id);

  // ── Line selection ────────────────────────────────────────────

  const selectLine = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(lines.length - 1, idx));
    setSelectedLineIdx(clamped);
    updateStorage(prev => ({ ...prev, selectedLineId: lines[clamped].id }));
  }, [lines, updateStorage]);

  const prevLine = useCallback(() => selectLine(selectedLineIdx - 1), [selectLine, selectedLineIdx]);
  const nextLine = useCallback(() => selectLine(selectedLineIdx + 1), [selectLine, selectedLineIdx]);

  // ── Rep increment ─────────────────────────────────────────────
  // +1 rep, +2 mastery (capped at 100), updates lastTrained timestamp

  const incrementRep = useCallback(() => {
    const lineId = selectedLine?.id;
    if (!lineId) return;
    updateStorage(prev => {
      const cur = prev.lineStats[lineId] ?? defaultStats();
      return {
        ...prev,
        lineStats: {
          ...prev.lineStats,
          [lineId]: {
            repetitions: cur.repetitions + 1,
            lastTrained: new Date().toISOString(),
            masteryScore: Math.min(100, cur.masteryScore + 2),
          },
        },
      };
    });
  }, [selectedLine?.id, updateStorage]);

  return {
    lines,
    selectedLine,
    selectedLineIdx,
    selectedLineStats,
    getLineStats,
    selectLine,
    prevLine,
    nextLine,
    incrementRep,
    isFirst: selectedLineIdx === 0,
    isLast: selectedLineIdx === lines.length - 1,
    totalLines: lines.length,
  };
}
