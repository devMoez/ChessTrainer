/**
 * GLOBAL PUZZLE CACHE STORE
 * Persistent in-memory cache for puzzle FEN positions and metadata.
 * Zero dependencies, maximum performance.
 */

class PuzzleCacheStore {
  constructor() {
    // Cache structure: { puzzleId: { fen, category, difficulty, ...metadata } }
    this.cache = new Map();
    this.initialized = false;
    this.listeners = new Set();
  }

  /**
   * Preload all puzzles into cache
   */
  preloadPuzzles(puzzles) {
    if (this.initialized) return;
    
    puzzles.forEach(puzzle => {
      this.cache.set(puzzle.id, {
        id: puzzle.id,
        fen: puzzle.fen,
        category: puzzle.category,
        difficulty: puzzle.difficulty,
        tags: puzzle.tags,
        description: puzzle.description,
        moves: puzzle.moves
      });
    });
    
    this.initialized = true;
    this.notifyListeners();
  }

  /**
   * Get puzzle from cache
   */
  getPuzzle(puzzleId) {
    return this.cache.get(puzzleId);
  }

  /**
   * Get FEN for a puzzle
   */
  getFen(puzzleId) {
    const puzzle = this.cache.get(puzzleId);
    return puzzle?.fen || null;
  }

  /**
   * Check if cache is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Get all cached puzzles
   */
  getAllPuzzles() {
    return Array.from(this.cache.values());
  }

  /**
   * Subscribe to cache changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Clear cache (for testing/reset)
   */
  clear() {
    this.cache.clear();
    this.initialized = false;
    this.notifyListeners();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Singleton instance
const puzzleCacheStore = new PuzzleCacheStore();

export default puzzleCacheStore;
