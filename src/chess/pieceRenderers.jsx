/**
 * GLOBAL PIECE RENDERER CACHE
 * Caches React components for chess pieces to avoid recreation on every render
 * 
 * Performance Benefits:
 * - O(1) lookups for piece renderers
 * - Shares renderers across all board instances
 * - Minimal memory overhead (~12 pieces × N sizes)
 * - Instant board rendering
 */

import { ChessPieceSVG } from '../components/ChessPieces.jsx';

const OUTER_WRAP_STYLE = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function toSafeSizePx(piecePx) {
  return Number.isFinite(piecePx) && piecePx > 0 ? piecePx : 45;
}

const SVG_SCALE = 0.75;

// Global cache: Map<cacheKey, pieceRendererObject>
// cacheKey format: "${pieceStyle}-${size}"
const pieceRenderersCache = new Map();

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  totalSizes: 0
};

export function buildClassicPieces() {
  // Return undefined so react-chessboard uses its internal default pieces
  return undefined;
}

export function buildSvgPieces(squarePx) {
  const square = toSafeSizePx(squarePx);
  const size = Math.max(10, Math.round(square * SVG_SCALE));
  
  // Normalize size to nearest 5px to reduce cache entries
  // (board sizes rarely differ by less than 5px)
  const normalizedSize = Math.round(size / 5) * 5;
  const cacheKey = `svg-${normalizedSize}`;
  
  // Return cached renderers if available
  if (pieceRenderersCache.has(cacheKey)) {
    stats.hits++;
    return pieceRenderersCache.get(cacheKey);
  }
  
  stats.misses++;
  stats.totalSizes = pieceRenderersCache.size + 1;

  const wrap = (pieceChar) => {
    const PieceRenderer = (props) => {
      if (!ChessPieceSVG) {
        return null;
      }
      return (
        <div style={OUTER_WRAP_STYLE}>
          <ChessPieceSVG piece={pieceChar} size={normalizedSize} svgStyle={props?.svgStyle} />
        </div>
      );
    };
    PieceRenderer.displayName = `CustomPiece-${pieceChar}-${normalizedSize}`;
    return PieceRenderer;
  };

  const renderers = {
    wP: wrap('P'),
    wN: wrap('N'),
    wB: wrap('B'),
    wR: wrap('R'),
    wQ: wrap('Q'),
    wK: wrap('K'),
    bP: wrap('p'),
    bN: wrap('n'),
    bB: wrap('b'),
    bR: wrap('r'),
    bQ: wrap('q'),
    bK: wrap('k'),
  };
  
  // Cache the renderers
  pieceRenderersCache.set(cacheKey, renderers);
  
  if (import.meta.env.DEV && stats.misses % 5 === 0) {
    console.log('[PieceCache]', {
      cacheKey,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits > 0 
        ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`
        : '0%',
      cachedSizes: stats.totalSizes
    });
  }
  
  return renderers;
}

export function getPieceRenderers(pieceStyle, squarePx) {
  if (pieceStyle === '2D') return buildSvgPieces(squarePx);
  // Default matches the classic set - no caching needed (returns undefined)
  return buildClassicPieces();
}

// For testing/debugging
export function getCacheStats() {
  return {
    ...stats,
    hitRate: stats.hits > 0 
      ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`
      : '0%',
    cachedSizes: pieceRenderersCache.size
  };
}

export function clearPieceCache() {
  pieceRenderersCache.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.totalSizes = 0;
}
