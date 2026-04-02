import { useState, useEffect, useSyncExternalStore } from 'react';
import puzzleCacheStore from '../stores/puzzleCache.js';

/**
 * Hook to access puzzle cache with React integration
 */
export function usePuzzleCache() {
  const isReady = useSyncExternalStore(
    puzzleCacheStore.subscribe.bind(puzzleCacheStore),
    () => puzzleCacheStore.isReady(),
    () => false
  );

  return {
    isReady,
    getPuzzle: (id) => puzzleCacheStore.getPuzzle(id),
    getFen: (id) => puzzleCacheStore.getFen(id),
    size: puzzleCacheStore.size()
  };
}

/**
 * Hook to get a specific puzzle from cache
 */
export function useCachedPuzzle(puzzleId) {
  const [puzzle, setPuzzle] = useState(() => puzzleCacheStore.getPuzzle(puzzleId));

  useEffect(() => {
    const unsubscribe = puzzleCacheStore.subscribe(() => {
      const updated = puzzleCacheStore.getPuzzle(puzzleId);
      if (updated) {
        setPuzzle(updated);
      }
    });
    return unsubscribe;
  }, [puzzleId]);

  return puzzle;
}

/**
 * Hook to get FEN for a puzzle (optimized for preview boards)
 */
export function useCachedFen(puzzleId) {
  const [fen, setFen] = useState(() => puzzleCacheStore.getFen(puzzleId));

  useEffect(() => {
    const unsubscribe = puzzleCacheStore.subscribe(() => {
      const updated = puzzleCacheStore.getFen(puzzleId);
      if (updated) {
        setFen(updated);
      }
    });
    return unsubscribe;
  }, [puzzleId]);

  return fen;
}
