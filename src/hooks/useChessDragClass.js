import { useCallback, useEffect, useMemo, useState } from 'react';

const ACTIVE_DRAG_CLASS = 'chess-piece-dragging';

export default function useChessDragClass() {
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const clearDragState = () => setIsDraggingPiece(false);

    if (isDraggingPiece) {
      document.body.classList.add(ACTIVE_DRAG_CLASS);
    } else {
      document.body.classList.remove(ACTIVE_DRAG_CLASS);
    }

    if (!isDraggingPiece) return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        clearDragState();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        clearDragState();
      }
    };

    window.addEventListener('pointerup', clearDragState, true);
    window.addEventListener('pointercancel', clearDragState, true);
    window.addEventListener('mouseup', clearDragState, true);
    window.addEventListener('touchend', clearDragState, true);
    window.addEventListener('touchcancel', clearDragState, true);
    window.addEventListener('dragend', clearDragState, true);
    window.addEventListener('blur', clearDragState);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.body.classList.remove(ACTIVE_DRAG_CLASS);
      window.removeEventListener('pointerup', clearDragState, true);
      window.removeEventListener('pointercancel', clearDragState, true);
      window.removeEventListener('mouseup', clearDragState, true);
      window.removeEventListener('touchend', clearDragState, true);
      window.removeEventListener('touchcancel', clearDragState, true);
      window.removeEventListener('dragend', clearDragState, true);
      window.removeEventListener('blur', clearDragState);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDraggingPiece]);

  const handlePieceDragStart = useCallback(() => {
    setIsDraggingPiece(true);
  }, []);

  const clearPieceDrag = useCallback(() => {
    setIsDraggingPiece(false);
  }, []);

  const draggingPieceStyle = useMemo(() => ({
    transform: 'scale(1.14)',
    position: 'relative',
    zIndex: 9999,
    pointerEvents: 'none',
    filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.34))',
    willChange: 'transform',
  }), []);

  const draggingPieceGhostStyle = useMemo(() => ({
    opacity: 0.18,
  }), []);

  return {
    isDraggingPiece,
    handlePieceDragStart,
    clearPieceDrag,
    draggingPieceStyle,
    draggingPieceGhostStyle,
  };
}
