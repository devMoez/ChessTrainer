import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useApp } from '../context/AppContext.jsx';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';
import useChessDragClass from '../hooks/useChessDragClass.js';

const DEFAULT_BOARD_PX = 756;

export default function ChessBoard({
  fen,
  mode = 'analysis',
  onMove,
  isLocked = false,
  orientation = 'white',
  onSquareClick,
  squareRenderer,
  arrows = [],
  squareStyles,
  allowDragOffBoard = false,
  allowDrawingArrows = false,
  animationDurationInMs = 100,
  showNotation = true,
  arePremovesAllowed,
  clearPremovesOnRightClick,
  className = 'chessboard-container premium-board-shell',
  boardId,
  onBoardSizeChange,
  children,
}) {
  const { boardTheme, pieceStyle } = useApp();
  const {
    clearPieceDrag,
    draggingPieceGhostStyle,
    draggingPieceStyle,
    handlePieceDragStart,
  } = useChessDragClass();
  const boardWrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(DEFAULT_BOARD_PX);

  useEffect(() => {
    const element = boardWrapRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries?.[0]?.contentRect?.width ?? 0;
      if (Number.isFinite(nextWidth) && nextWidth > 0) {
        setBoardPx(nextWidth);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    onBoardSizeChange?.(boardPx);
  }, [boardPx, onBoardSizeChange]);

  useEffect(() => {
    if (isLocked) {
      clearPieceDrag();
    }
  }, [clearPieceDrag, isLocked]);

  const squarePx = useMemo(() => Math.max(1, boardPx / 8), [boardPx]);
  const customPieces = useMemo(
    () => getPieceRenderers(pieceStyle, squarePx),
    [pieceStyle, squarePx]
  );

  const boardOptions = useMemo(() => {
    const handlePieceDrop = (args) => {
      const result = onMove?.(args);
      clearPieceDrag();
      return result;
    };

    const options = {
      id: boardId ?? `${mode}-board`,
      position: fen,
      boardOrientation: orientation,
      customLightSquareStyle: { backgroundColor: boardTheme.light },
      customDarkSquareStyle: { backgroundColor: boardTheme.dark },
      animationDurationInMs,
      showNotation,
      allowDragging: !isLocked,
      allowDragOffBoard,
      allowDrawingArrows,
      arrows,
      squareRenderer,
      squareStyles,
      onPieceDrag: handlePieceDragStart,
      draggingPieceStyle,
      draggingPieceGhostStyle,
    };

    if (onMove && !isLocked) {
      options.onPieceDrop = handlePieceDrop;
    }

    if (onSquareClick) {
      options.onSquareClick = onSquareClick;
    }

    if (typeof arePremovesAllowed === 'boolean') {
      options.arePremovesAllowed = arePremovesAllowed;
    }

    if (typeof clearPremovesOnRightClick === 'boolean') {
      options.clearPremovesOnRightClick = clearPremovesOnRightClick;
    }

    if (customPieces) {
      options.pieces = customPieces;
    }

    return options;
  }, [
    allowDragOffBoard,
    allowDrawingArrows,
    animationDurationInMs,
    arePremovesAllowed,
    arrows,
    boardId,
    boardTheme.dark,
    boardTheme.light,
    clearPremovesOnRightClick,
    clearPieceDrag,
    customPieces,
    fen,
    draggingPieceGhostStyle,
    draggingPieceStyle,
    handlePieceDragStart,
    isLocked,
    mode,
    onMove,
    onSquareClick,
    orientation,
    showNotation,
    squareRenderer,
    squareStyles,
  ]);

  return (
    <ChessboardProvider options={boardOptions}>
      <div ref={boardWrapRef} className={className} data-board-mode={mode}>
        <Chessboard />
        {children}
      </div>
    </ChessboardProvider>
  );
}
