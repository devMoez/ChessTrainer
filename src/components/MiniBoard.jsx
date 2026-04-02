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
 * OPTIMIZED STATIC MINI BOARD
 * - No animations
 * - No dragging
 * - Persistent rendering
 * - Memoized to prevent re-renders
 */
const MiniBoard = memo(function MiniBoard({ 
  fen, 
  lightColor = '#F0D9B5', 
  darkColor = '#B58863', 
  orientation = 'white' 
}) {
  const { pieceStyle } = useApp();
  const [boardId] = useState(() => nextMiniBoardId());
  const wrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(0);
  
  // Use ref to track if we've measured to avoid unnecessary updates
  const hasMeasured = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0 && (!hasMeasured.current || Math.abs(boardPx - w) > 5)) {
        setBoardPx(w);
        hasMeasured.current = true;
      }
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [boardPx]);

  const squarePx = useMemo(() => Math.max(1, Math.floor(boardPx / 8)), [boardPx]);
  const pieces = useMemo(() => getPieceRenderers(pieceStyle, squarePx), [pieceStyle, squarePx]);
  
  // Memoize position to ensure stable reference
  const position = useMemo(() => fen || START_POSITION, [fen]);
  
  // Memoize square styles to prevent re-creation
  const darkSquareStyle = useMemo(() => ({ backgroundColor: darkColor }), [darkColor]);
  const lightSquareStyle = useMemo(() => ({ backgroundColor: lightColor }), [lightColor]);

  return (
    <div
      ref={wrapRef}
      className="mini-board"
      style={{ width: '100%', aspectRatio: '1', pointerEvents: 'none', userSelect: 'none' }}
      aria-hidden="true"
    >
      {boardPx > 0 && (
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

