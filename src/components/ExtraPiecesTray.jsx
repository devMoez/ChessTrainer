import React, { memo } from 'react';
import { SparePiece } from 'react-chessboard';

function ExtraPiecesTrayRow({
  pieceTypes,
  squarePx,
  ariaLabel = 'Extra pieces tray',
  disabled = false,
}) {
  const size = Number.isFinite(squarePx) && squarePx > 0 ? squarePx : 60;

  return (
    <div
      className={`extra-pieces-row${disabled ? ' is-disabled' : ''}`}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {pieceTypes.map((pieceType) => (
        <div
          key={pieceType}
          className="extra-piece-wrapper"
          style={{ width: size, height: size }}
        >
          <SparePiece pieceType={pieceType} />
        </div>
      ))}
    </div>
  );
}

export default memo(ExtraPiecesTrayRow);
