import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Chessboard } from 'react-chessboard';
import { useApp } from '../context/AppContext.jsx';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

let miniBoardSeq = 0;
function nextMiniBoardId() {
  miniBoardSeq += 1;
  return `mini-board-${miniBoardSeq}`;
}

/**
 * Validate FEN string format
 */
function isValidFen(fen) {
  if (!fen || typeof fen !== 'string') return false;
  const parts = fen.trim().split(/\s+/);
  // Basic validation: should have at least board position part
  return parts.length >= 1 && parts[0].split('/').length === 8;
}

/**
 * OPTIMIZED STATIC MINI BOARD
 * 
 * Key Features:
 * - NO animations (animationDuration: 0)
 * - NO dragging (arePiecesDraggable: false)
 * - NO arrows (areArrowsAllowed: false)
 * - Persistent rendering (stable board ID)
 * - Memoized to prevent re-renders
 * - FEN validation before render
 * - Skeleton placeholder if FEN not ready
 * 
 * Performance:
 * - Renders only when FEN/colors change
 * - Stable piece renderers (memoized by size)
 * - ResizeObserver for efficient sizing
 * - CSS containment for layout isolation
 */
const MiniBoard = memo(function MiniBoard({ 
  fen, 
  lightColor = '#F0D9B5', 
  darkColor = '#B58863', 
  orientation = 'white',
  showSkeleton = true // Show skeleton if FEN invalid/missing
}) {
  const { pieceStyle } = useApp();
  const [boardId] = useState(() => nextMiniBoardId());
  const wrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(300); // Default 300px instead of 0
  const previousWidth = useRef(0);
  
  // Validate FEN
  const validFen = useMemo(() => {
    if (!fen) return null;
    return isValidFen(fen) ? fen : null;
  }, [fen]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      // Update if width is valid and different from previous
      if (w > 0 && Math.abs(previousWidth.current - w) > 2) {
        previousWidth.current = w;
        setBoardPx(w);
      }
    };

    // Initial measurement
    measure();
    
    // Fallback measurement (in case element not ready)
    const timeout = setTimeout(measure, 50);

    if (typeof ResizeObserver === 'undefined') {
      clearTimeout(timeout);
      return;
    }
    
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => {
      clearTimeout(timeout);
      ro.disconnect();
    };
  }, []);

  const squarePx = useMemo(() => Math.max(1, Math.floor(boardPx / 8)), [boardPx]);
  
  // Memoize piece renderers - always generate pieces
  const pieces = useMemo(() => {
    return getPieceRenderers(pieceStyle, squarePx);
  }, [pieceStyle, squarePx]);
  
  // Use validated FEN or fallback to start position
  const position = useMemo(() => validFen || START_POSITION, [validFen]);
  
  // Memoize square styles to prevent object re-creation
  const darkSquareStyle = useMemo(() => ({ backgroundColor: darkColor }), [darkColor]);
  const lightSquareStyle = useMemo(() => ({ backgroundColor: lightColor }), [lightColor]);

  // Show skeleton if FEN is invalid and skeleton is enabled
  const shouldShowSkeleton = showSkeleton && !validFen && fen;

  return (
    <div
      ref={wrapRef}
      className="mini-board"
      style={{ 
        width: '100%',
        height: '100%',
        minHeight: '260px',
        aspectRatio: '1', 
        pointerEvents: 'none', 
        userSelect: 'none',
        contain: 'layout style paint',
        position: 'relative'
      }}
      aria-hidden="true"
    >
      {shouldShowSkeleton ? (
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(45deg, ${lightColor} 25%, ${darkColor} 25%, ${darkColor} 50%, ${lightColor} 50%, ${lightColor} 75%, ${darkColor} 75%, ${darkColor})`,
          backgroundSize: '28.28% 28.28%',
          opacity: 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          Loading...
        </div>
      ) : (
        <Chessboard
          id={boardId}
          position={position}
          boardOrientation={orientation}
          arePiecesDraggable={false}
          areArrowsAllowed={false}
          showBoardNotation={false}
          animationDuration={0}
          customDarkSquareStyle={darkSquareStyle}
          customLightSquareStyle={lightSquareStyle}
          customPieces={pieces}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if critical props change
  return (
    prevProps.fen === nextProps.fen &&
    prevProps.orientation === nextProps.orientation &&
    prevProps.lightColor === nextProps.lightColor &&
    prevProps.darkColor === nextProps.darkColor
  );
});

export default MiniBoard;

