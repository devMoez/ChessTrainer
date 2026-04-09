/**
 * GLOBAL OPENING CACHE STORE
 * Persistent in-memory cache for opening FEN positions and metadata.
 * 
 * Key Features:
 * - Singleton pattern ensures global state
 * - Preloads ALL openings on first mount
 * - Observer pattern for React integration
 * - Zero re-fetching once loaded
 * - Instant FEN access for preview boards
 * 
 * Performance:
 * - Map-based O(1) lookups
 * - No re-initialization
 * - Minimal memory footprint
 */

import { getAllOpeningsWithFENs } from '../utils/openingFenCache.js';

class OpeningCacheStore {
  constructor() {
    // Cache structure: { openingId: { fen, name, moves, ...metadata } }
    this.cache = new Map();
    this.initialized = false;
    this.preloading = false;
    this.listeners = new Set();
    this.stats = {
      totalOpenings: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.init();
  }

  /**
   * Initialize cache synchronously on module load
   */
  init() {
    const openings = getAllOpeningsWithFENs();
    this.preloadOpenings(openings);
  }

  /**
   * Preload all openings into cache (idempotent)
   * Can be called multiple times safely - only initializes once
   */
  preloadOpenings(openings) {
    // Prevent duplicate initialization
    if (this.initialized || this.preloading) {
      return;
    }
    
    this.preloading = true;

    // Validate input
    if (!Array.isArray(openings) || openings.length === 0) {
      console.warn('[OpeningCache] No openings provided for preloading');
      this.preloading = false;
      return;
    }

    // Batch load all openings
    openings.forEach(opening => {
      // Validate opening structure
      if (!opening.id) {
        console.warn('[OpeningCache] Invalid opening structure (no ID):', opening);
        return;
      }

      const previewFEN = opening.previewFEN || opening.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      this.cache.set(opening.id, {
        id: opening.id,
        name: opening.name,
        fen: opening.fen,
        previewFEN: previewFEN,
        moves: opening.moves,
        eco: opening.eco,
        difficulty: opening.difficulty,
        winRate: opening.winRate,
        popularity: opening.popularity,
        color: opening.color,
        description: opening.description || '',
        tags: opening.tags || [],
        variations: (opening.variations || []).map(v => ({
          ...v,
          previewFEN: v.previewFEN || v.fen || previewFEN
        }))
      });
    });

    this.stats.totalOpenings = this.cache.size;
    this.initialized = true;
    this.preloading = false;
    
    this.notifyListeners();
  }

  /**
   * Get opening from cache with tracking
   */
  getOpening(openingId) {
    const opening = this.cache.get(openingId);
    if (opening) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
      console.warn(`[OpeningCache] Cache miss for opening: ${openingId}`);
    }
    return opening;
  }

  /**
   * Get FEN for an opening (optimized for preview boards)
   * Returns null if not found (component can show placeholder)
   */
  getFen(openingId) {
    const opening = this.cache.get(openingId);
    if (opening) {
      this.stats.cacheHits++;
      return opening.previewFEN;
    } else {
      this.stats.cacheMisses++;
      return null;
    }
  }
  
  /**
   * Check if a specific opening is cached
   */
  hasOpening(openingId) {
    return this.cache.has(openingId);
  }

  /**
   * Check if cache is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Get all cached openings
   */
  getAllOpenings() {
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
const openingCacheStore = new OpeningCacheStore();

export default openingCacheStore;
