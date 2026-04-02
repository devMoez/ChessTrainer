import { useEffect } from 'react';
import openingCacheStore from '../stores/openingCache.js';
import puzzleCacheStore from '../stores/puzzleCache.js';
import { OPENINGS } from '../data/openings.js';
import { PUZZLES_BY_CATEGORY } from '../data/puzzles.js';

/**
 * GLOBAL CACHE INITIALIZER
 * 
 * Preloads all openings and puzzles into memory on app mount.
 * This ensures instant preview board rendering with zero flicker.
 * 
 * Key Features:
 * - Runs once on app initialization
 * - Preloads ALL opening FENs
 * - Preloads ALL puzzle FENs
 * - Enables O(1) FEN lookups for preview boards
 * - Zero network requests needed
 * 
 * Performance:
 * - ~300 openings = ~30KB memory
 * - ~100 puzzles = ~10KB memory
 * - Total overhead: ~40KB for instant rendering
 */
export function useCacheInitializer() {
  useEffect(() => {
    console.log('[CacheInitializer] Starting cache preload...');
    
    // Preload openings
    if (!openingCacheStore.isReady()) {
      console.log('[CacheInitializer] Preloading', OPENINGS.length, 'openings');
      openingCacheStore.preloadOpenings(OPENINGS);
    } else {
      console.log('[CacheInitializer] Opening cache already ready');
    }

    // Preload puzzles - flatten all categories
    if (!puzzleCacheStore.isReady()) {
      const allPuzzles = Object.values(PUZZLES_BY_CATEGORY).flat();
      console.log('[CacheInitializer] Preloading', allPuzzles.length, 'puzzles');
      puzzleCacheStore.preloadPuzzles(allPuzzles);
    } else {
      console.log('[CacheInitializer] Puzzle cache already ready');
    }

    // Log cache statistics in development
    setTimeout(() => {
      console.log('[Cache] Opening stats:', openingCacheStore.getStats());
      console.log('[Cache] Puzzle stats:', puzzleCacheStore.getStats());
      
      // Test a few FENs
      const testOpening = openingCacheStore.getOpening('ruy-lopez-main');
      console.log('[Cache] Test opening (ruy-lopez-main):', testOpening);
      
      const testPuzzle = puzzleCacheStore.getPuzzle('m1-001');
      console.log('[Cache] Test puzzle (m1-001):', testPuzzle);
    }, 100);
  }, []);
}

/**
 * Hook to get cached opening FEN
 * Returns null if not cached (component can show skeleton)
 */
export function useCachedOpening(openingId) {
  if (!openingId) return null;
  return openingCacheStore.getOpening(openingId);
}

/**
 * Hook to get cached puzzle FEN
 * Returns null if not cached (component can show skeleton)
 */
export function useCachedPuzzle(puzzleId) {
  if (!puzzleId) return null;
  return puzzleCacheStore.getPuzzle(puzzleId);
}

/**
 * Direct FEN access (no hook, for optimization)
 */
export function getOpeningFen(openingId) {
  return openingCacheStore.getFen(openingId);
}

export function getPuzzleFen(puzzleId) {
  return puzzleCacheStore.getFen(puzzleId);
}
