/**
 * CACHE INITIALIZER HOOKS
 *
 * The opening FEN cache is now populated synchronously at module load
 * (see src/utils/openingFenCache.js + src/stores/openingCache.js).
 *
 * This file keeps the React-integration hooks (useCachedOpenings, etc.)
 * but no longer calculates FENs or preloads anything — that all happens
 * before the first render, with zero useEffect overhead.
 */

import * as React from 'react';
import openingCacheStore from '../stores/openingCache.js';
import puzzleCacheStore from '../stores/puzzleCache.js';
import { PUZZLES_BY_CATEGORY } from '../data/puzzles.js';

/**
 * No-op initialiser kept for backward compat with App.jsx.
 * Puzzles still need their own preload (they have no FEN cache utility yet).
 */
export function useCacheInitializer() {
  React.useEffect(() => {
    // Puzzles — still loaded here because they don't have a synchronous cache
    if (!puzzleCacheStore.isReady()) {
      const allPuzzles = Object.values(PUZZLES_BY_CATEGORY).flat();
      puzzleCacheStore.preloadPuzzles(allPuzzles);
    }

    if (import.meta.env.DEV) {
      console.log('[CacheInitializer] Opening cache already ready:', openingCacheStore.isReady());
      console.log('[Cache] Opening stats:', openingCacheStore.getStats());
      console.log('[Cache] Puzzle stats:', puzzleCacheStore.getStats());
    }
  }, []);
}

// ─── React hooks ──────────────────────────────────────────────────────────────

/**
 * Subscribe to the opening cache and return the full openings array.
 * Because the cache is already initialised synchronously, the very first
 * render already gets the complete, correct list — no loading state needed.
 */
export function useCachedOpenings() {
  const [openings, setOpenings] = React.useState(
    () => openingCacheStore.getAllOpenings(),   // initialiser runs synchronously
  );
  const [isReady, setIsReady] = React.useState(
    () => openingCacheStore.isReady(),
  );

  React.useEffect(() => {
    // Sync in case the store updated between render and effect
    setOpenings(openingCacheStore.getAllOpenings());
    setIsReady(openingCacheStore.isReady());

    // Subscribe so future updates (e.g. clear/reset) propagate
    const unsubscribe = openingCacheStore.subscribe(() => {
      setOpenings(openingCacheStore.getAllOpenings());
      setIsReady(openingCacheStore.isReady());
    });

    return unsubscribe;
  }, []);

  return { openings, isReady };
}

/**
 * Return a single cached opening by ID (no hook — synchronous).
 */
export function useCachedOpening(openingId) {
  if (!openingId) return null;
  return openingCacheStore.getOpening(openingId);
}

/**
 * Return a single cached puzzle by ID (no hook — synchronous).
 */
export function useCachedPuzzle(puzzleId) {
  if (!puzzleId) return null;
  return puzzleCacheStore.getPuzzle(puzzleId);
}

/** Direct FEN access (no hook) */
export function getOpeningFen(openingId) {
  return openingCacheStore.getFen(openingId);
}

export function getPuzzleFen(puzzleId) {
  return puzzleCacheStore.getFen(puzzleId);
}

/** Get all cached openings directly (no hook) */
export function getAllCachedOpenings() {
  return openingCacheStore.getAllOpenings();
}
