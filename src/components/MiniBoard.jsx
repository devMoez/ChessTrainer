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
  const [boardPx, setBoardPx] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setBoardPx(w);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const squarePx = useMemo(() => Math.max(1, Math.floor(boardPx / 8)), [boardPx]);
  const pieces = useMemo(() => getPieceRenderers(pieceStyle, squarePx), [pieceStyle, squarePx]);

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
          position={fen || START_POSITION}
          boardOrientation={orientation}
          arePiecesDraggable={false}
          showBoardNotation={false}
          animationDuration={0}
          customDarkSquareStyle={{ backgroundColor: darkColor }}
          customLightSquareStyle={{ backgroundColor: lightColor }}
          customPieces={pieces}
        />
      )}
    </div>
  );
});

export default MiniBoard;
