/**
 * GLOBAL PUZZLE CACHE STORE
 * Persistent in-memory cache for puzzle FEN positions and metadata.
 * 
 * Key Features:
 * - Singleton pattern ensures global state
 * - Preloads ALL puzzles on first mount
 * - Observer pattern for React integration
 * - Zero re-fetching once loaded
 * - Instant FEN access for preview boards
 * 
 * Performance:
 * - Map-based O(1) lookups
 * - No re-initialization
 * - Minimal memory footprint (~50KB for 100 puzzles)
 */

class PuzzleCacheStore {
  constructor() {
    // Cache structure: { puzzleId: { fen, category, difficulty, ...metadata } }
    this.cache = new Map();
    this.initialized = false;
    this.preloading = false;
    this.listeners = new Set();
    this.stats = {
      totalPuzzles: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Preload all puzzles into cache (idempotent)
   * Can be called multiple times safely - only initializes once
   */
  preloadPuzzles(puzzles) {
    // Prevent duplicate initialization
    if (this.initialized || this.preloading) {
      return;
    }
    
    this.preloading = true;
    
    // Validate input
    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      console.warn('[PuzzleCache] No puzzles provided for preloading');
      this.preloading = false;
      return;
    }
    
    // Batch load all puzzles
    puzzles.forEach(puzzle => {
      // Validate puzzle structure
      if (!puzzle.id || !puzzle.fen) {
        console.warn('[PuzzleCache] Invalid puzzle structure:', puzzle);
        return;
      }
      
      this.cache.set(puzzle.id, {
        id: puzzle.id,
        fen: puzzle.fen,
        category: puzzle.category,
        difficulty: puzzle.difficulty,
        tags: puzzle.tags || [],
        description: puzzle.description || '',
        moves: puzzle.moves || []
      });
    });
    
    this.stats.totalPuzzles = this.cache.size;
    this.initialized = true;
    this.preloading = false;
    
    console.log(`[PuzzleCache] ✓ Preloaded ${this.stats.totalPuzzles} puzzles`);
    this.notifyListeners();
  }

  /**
   * Get puzzle from cache with tracking
   */
  getPuzzle(puzzleId) {
    const puzzle = this.cache.get(puzzleId);
    if (puzzle) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
      console.warn(`[PuzzleCache] Cache miss for puzzle: ${puzzleId}`);
    }
    return puzzle;
  }

  /**
   * Get FEN for a puzzle (optimized for preview boards)
   * Returns null if not found (component can show placeholder)
   */
  getFen(puzzleId) {
    const puzzle = this.cache.get(puzzleId);
    if (puzzle) {
      this.stats.cacheHits++;
      return puzzle.fen;
    } else {
      this.stats.cacheMisses++;
      return null;
    }
  }
  
  /**
   * Check if a specific puzzle is cached
   */
  hasPuzzle(puzzleId) {
    return this.cache.has(puzzleId);
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
  
  /**
   * Get cache statistics for debugging/monitoring
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.cacheHits > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      initialized: this.initialized,
      preloading: this.preloading
    };
  }
  
  /**
   * Reset cache statistics (useful for testing)
   */
  resetStats() {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }
}

// Singleton instance
const puzzleCacheStore = new PuzzleCacheStore();

export default puzzleCacheStore;
