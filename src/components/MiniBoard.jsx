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

const MiniBoard = memo(function MiniBoard({ fen, lightColor = '#F0D9B5', darkColor = '#B58863', orientation = 'white' }) {
  const { pieceStyle } = useApp();
  const [boardId] = useState(() => nextMiniBoardId());
  const wrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(300); // Default to 300px for instant render
  const previousWidth = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      // Only update if width changed significantly (> 2px) to reduce re-renders
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
  
  // Pieces are now globally cached - this will be instant after first render
  const pieces = useMemo(() => getPieceRenderers(pieceStyle, squarePx), [pieceStyle, squarePx]);

  // Memoize position to prevent unnecessary recalculations
  const position = useMemo(() => fen || START_POSITION, [fen]);
  
  // Memoize square styles
  const lightSquareStyle = useMemo(() => ({ backgroundColor: lightColor }), [lightColor]);
  const darkSquareStyle = useMemo(() => ({ backgroundColor: darkColor }), [darkColor]);

  return (
    <div
      ref={wrapRef}
      className="mini-board"
      style={{ 
        width: '100%', 
        aspectRatio: '1', 
        pointerEvents: 'none', 
        userSelect: 'none',
        contain: 'layout style paint' // CSS containment for performance
      }}
      aria-hidden="true"
    >
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
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if critical props actually change
  return (
    prevProps.fen === nextProps.fen &&
    prevProps.orientation === nextProps.orientation &&
    prevProps.lightColor === nextProps.lightColor &&
    prevProps.darkColor === nextProps.darkColor
  );
});

export default MiniBoard;
