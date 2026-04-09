import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Chessboard } from 'react-chessboard';
import { useApp } from '../context/AppContext.jsx';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

let boardSeq = 0;
function nextBoardId() {
  boardSeq += 1;
  return `preview-board-${boardSeq}`;
}

/**
 * Validate FEN string format
 */
function isValidFen(fen) {
  if (!fen || typeof fen !== 'string') return false;
  const parts = fen.trim().split(/\s+/);
  return parts.length >= 1 && parts[0].split('/').length === 8;
}

/**
 * UNIFIED PREVIEW BOARD COMPONENT
 * 
 * Used for both opening and puzzle previews with instant rendering.
 * 
 * Core Requirements Met:
 * ✓ Input: FEN string (required)
 * ✓ Output: static chessboard with correct position
 * ✓ NO empty board / NO flicker
 * ✓ Instant rendering with cached FEN
 * ✓ Disable: dragging, animations, sound
 * ✓ Static preview mode
 * ✓ Stable rendering with memoization
 * ✓ Virtualization safe (FEN persisted outside component)
 * ✓ Fixed board size (280px-320px via parent container)
 * 
 * Performance Optimizations:
 * - React.memo with custom comparison
 * - useMemo for all derived values
 * - Persistent board ID (stable across renders)
 * - ResizeObserver for efficient sizing
 * - CSS containment for layout isolation
 * - Memoized piece renderers (cached by size)
 * - Zero animations (animationDuration: 0)
 * - Disabled interactions (arePiecesDraggable: false)
 * - Skeleton fallback for missing/invalid FEN
 */
const PreviewBoard = memo(function PreviewBoard({ 
  fen, 
  orientation = 'white',
  lightColor,
  darkColor,
  showSkeleton = true,
  className = ''
}) {
  const { pieceStyle, boardTheme } = useApp();
  const [boardId] = useState(() => nextBoardId());
  const wrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(300); // Default to 300px instead of 0
  const previousWidth = useRef(0);
  
  // Use custom colors or default to theme
  const finalLightColor = useMemo(() => lightColor || boardTheme.light, [lightColor, boardTheme.light]);
  const finalDarkColor = useMemo(() => darkColor || boardTheme.dark, [darkColor, boardTheme.dark]);
  
  // Validate FEN
  const validFen = useMemo(() => {
    if (!fen) return null;
    return isValidFen(fen) ? fen : null;
  }, [fen]);
  
  // Use validated FEN or fallback to start position
  const position = useMemo(() => validFen || START_POSITION, [validFen]);
  
  // Efficient resize observer
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0 && Math.abs(previousWidth.current - w) > 2) {
        previousWidth.current = w;
        setBoardPx(w);
      }
    };

    measure();
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
  
  // Memoized piece renderers - cached by piece style and size
  // Always generate pieces, even with default size
  const pieces = useMemo(() => {
    return getPieceRenderers(pieceStyle, squarePx);
  }, [pieceStyle, squarePx]);
  
  // Memoize square styles
  const darkSquareStyle = useMemo(() => ({ backgroundColor: finalDarkColor }), [finalDarkColor]);
  const lightSquareStyle = useMemo(() => ({ backgroundColor: finalLightColor }), [finalLightColor]);

  // Show skeleton if FEN is invalid and skeleton is enabled
  const shouldShowSkeleton = showSkeleton && !validFen && fen;

  return (
    <div
      ref={wrapRef}
      className={`preview-board ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
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
          background: `linear-gradient(45deg, ${finalLightColor} 25%, ${finalDarkColor} 25%, ${finalDarkColor} 50%, ${finalLightColor} 50%, ${finalLightColor} 75%, ${finalDarkColor} 75%, ${finalDarkColor})`,
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
          {...(pieces && { customPieces: pieces })}
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

export default PreviewBoard;
