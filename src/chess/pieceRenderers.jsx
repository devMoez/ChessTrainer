import { defaultPieces } from 'react-chessboard';
import ChessPieceSVG from '../components/ChessPieces.jsx';

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

export function buildClassicPieces() {
  // Use react-chessboard's built-in "classic" SVG set
  return defaultPieces;
}

export function buildSvgPieces(squarePx) {
  const square = toSafeSizePx(squarePx);
  const size = Math.max(10, Math.round(square * SVG_SCALE));

  const wrap = (pieceChar) => {
    const PieceRenderer = (props) => (
      <div style={OUTER_WRAP_STYLE}>
        <ChessPieceSVG piece={pieceChar} size={size} svgStyle={props?.svgStyle} />
      </div>
    );
    PieceRenderer.displayName = `CustomPiece-${pieceChar}`;
    return PieceRenderer;
  };

  return {
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
}

export function getPieceRenderers(pieceStyle, squarePx) {
  if (pieceStyle === '2D') return buildSvgPieces(squarePx);
  // Default matches the classic set.
  return buildClassicPieces();
}
