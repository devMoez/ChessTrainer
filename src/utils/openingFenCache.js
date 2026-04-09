/**
 * OPENING FEN CACHE — Module-Level, One-Time Computation
 *
 * All FENs are computed synchronously when this module is first imported
 * (before any React component renders). The result is stored in a Map and
 * never recalculated, regardless of re-renders, navigation, or state changes.
 */

import { Chess } from 'chess.js';
import { OPENINGS } from '../data/openings.js';

// ─── Global cache (survives the entire app session) ──────────────────────────
const openingFENCache = new Map();
let isCacheInitialized = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Compute the final FEN from a PGN-style moves string or an array of moves.
 */
function computeFen(moves, initialFen) {
  if (!moves) return initialFen || START_FEN;

  try {
    const chess = new Chess();
    
    // 1. Try loadPgn first (most reliable for standard PGN)
    try {
      chess.loadPgn(moves);
      if (chess.fen() !== START_FEN) {
        return chess.fen();
      }
    } catch (e) {
      // continue
    }

    // 2. Manual move-by-move with sloppy parsing (fallback)
    const cleanMoves = moves
      .replace(/\{.*?\}/g, '')
      .replace(/\d+\.\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = cleanMoves.split(' ').filter(Boolean);
    const manualChess = new Chess();
    let allSucceeded = true;
    for (const t of tokens) {
      const norm = t.replace(/0/g, 'O');
      let ok = false;
      try { ok = !!manualChess.move(norm); } catch (err) {}
      if (!ok) try { ok = !!manualChess.move(norm, { sloppy: true }); } catch (err) {}
      if (!ok) {
        allSucceeded = false;
        break;
      }
    }

    // Only trust the computed FEN if ALL moves parsed successfully
    if (allSucceeded && tokens.length > 0) return manualChess.fen();

    // 3. Fall back to the stored FEN when move parsing fails partway
    if (initialFen && initialFen.split('/').length === 8) {
      return initialFen;
    }
    
    return START_FEN;
  } catch (err) {
    return initialFen || START_FEN;
  }
}

/**
 * One-time synchronous initialisation.
 * Populates the internal Map with final FENs for all openings and variations.
 */
export function initCache() {
  if (isCacheInitialized) return;
  
  for (const opening of OPENINGS) {
    // PREPROCESS OPENINGS: Compute final FEN once
    // Pass both moves and the original FEN as fallback
    const fen = computeFen(opening.moves, opening.fen);
    openingFENCache.set(opening.id, fen);

    // Also cache any variations
    if (Array.isArray(opening.variations)) {
      for (const variation of opening.variations) {
        const varFen = computeFen(variation.moves, variation.fen);
        if (variation.id) {
          openingFENCache.set(variation.id, varFen);
        }
      }
    }
  }
  
  isCacheInitialized = true;
}

/**
 * Return the cached FEN for a given opening/variation id.
 * Always O(1) — never re-runs chess.js once initialised.
 */
export function getOpeningFEN(openingId) {
  if (!isCacheInitialized) initCache();
  return openingFENCache.get(openingId) ?? null;
}

/**
 * Returns all openings from the data source, but with a `previewFEN` property
 * attached for UI rendering. (Requirement 4 & 5)
 */
export function getAllOpeningsWithFENs() {
  if (!isCacheInitialized) initCache();

  return OPENINGS.map((opening) => {
    // Prefer the FEN computed by playing through all moves (chess.js).
    // This is the canonical final position and avoids stale/wrong hardcoded FENs.
    // Falls back to opening.fen if move parsing failed (e.g. non-standard notation).
    const computedFen = openingFENCache.get(opening.id);
    const previewFEN = (computedFen && computedFen !== START_FEN ? computedFen : null)
      || opening.fen
      || START_FEN;
    return {
      ...opening,
      previewFEN,
      variations: opening.variations?.map((variation) => {
        const varComputed = variation.id ? openingFENCache.get(variation.id) : null;
        const varPreviewFEN = (varComputed && varComputed !== START_FEN ? varComputed : null)
          || variation.fen
          || previewFEN;
        return { ...variation, previewFEN: varPreviewFEN };
      }),
    };
  });
}

// Pre-initialise immediately on module load
initCache();

export { openingFENCache };
