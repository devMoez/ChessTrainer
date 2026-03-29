import { Chess } from 'chess.js';

export const DEFAULT_FEN = new Chess().fen();
export const DEFAULT_CASTLING = Object.freeze({ wK: true, wQ: true, bK: true, bQ: true });
export const WHITE_PIECES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'];
export const BLACK_PIECES = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
export const BOARD_SQUARES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].flatMap(file =>
  ['1', '2', '3', '4', '5', '6', '7', '8'].map(rank => `${file}${rank}`)
);

const SQUARE_RE = /^[a-h][1-8]$/;
const DRAW_REASONS = new Set(['draw', 'stalemate', 'threefold', 'insufficientMaterial']);

export function isBoardSquare(square) {
  return typeof square === 'string' && SQUARE_RE.test(square);
}

export function colorName(color) {
  return color === 'b' ? 'Black' : 'White';
}

export function isDrawReason(reason) {
  return DRAW_REASONS.has(reason);
}

export function findKingSquare(game, color) {
  for (const square of BOARD_SQUARES) {
    const piece = game.get(square);
    if (piece?.type === 'k' && piece.color === color) return square;
  }
  return null;
}

export function computeGameResult(game) {
  if (game.isCheckmate()) {
    const loser = game.turn();
    return {
      reason: 'checkmate',
      winner: loser === 'w' ? 'b' : 'w',
      loser,
    };
  }

  if (game.isStalemate()) return { reason: 'stalemate' };
  if (game.isThreefoldRepetition()) return { reason: 'threefold' };
  if (game.isInsufficientMaterial()) return { reason: 'insufficientMaterial' };
  if (game.isDrawByFiftyMoves()) {
    return {
      reason: 'draw',
      title: 'Draw by fifty-move rule',
      subtitle: 'No pawn move or capture was made in the last fifty moves.',
    };
  }
  if (game.isDraw()) return { reason: 'draw' };

  return null;
}

export function castlingStateFromFen(fen) {
  const rights = fen.split(' ')[2] || '-';
  return {
    wK: rights.includes('K'),
    wQ: rights.includes('Q'),
    bK: rights.includes('k'),
    bQ: rights.includes('q'),
  };
}

export function castlingStringFromState(castling) {
  const rights =
    `${castling?.wK ? 'K' : ''}` +
    `${castling?.wQ ? 'Q' : ''}` +
    `${castling?.bK ? 'k' : ''}` +
    `${castling?.bQ ? 'q' : ''}`;

  return rights || '-';
}

export function rebuildFen(baseFen, overrides = {}) {
  const parts = baseFen.trim().split(/\s+/);
  const board = overrides.board ?? parts[0];
  const turn = overrides.turn ?? parts[1] ?? 'w';
  const castling =
    overrides.castlingState ? castlingStringFromState(overrides.castlingState) : overrides.castling ?? parts[2] ?? '-';
  const enPassant = overrides.enPassant ?? parts[3] ?? '-';
  const halfMove = overrides.halfMove ?? parts[4] ?? '0';
  const fullMove = overrides.fullMove ?? parts[5] ?? '1';

  return `${board} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

export function stripEnPassant(fen) {
  return rebuildFen(fen, { enPassant: '-' });
}

export function parseUciMove(uciMove) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uciMove || '')) return null;

  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove[4],
  };
}

export function formatEngineScore(scoreType, rawScore) {
  const value = Number(rawScore);
  if (!Number.isFinite(value)) return '0.0';

  if (scoreType === 'mate') {
    return value < 0 ? `-M${Math.abs(value)}` : `M${value}`;
  }

  const score = value / 100;
  return `${score > 0 ? '+' : ''}${score.toFixed(1)}`;
}

export function squareToXY(square) {
  if (!isBoardSquare(square)) return null;
  const x = square.charCodeAt(0) - 97;
  const y = Number(square[1]) - 1;
  if (x < 0 || x > 7 || y < 0 || y > 7) return null;
  return { x, y };
}

export function xyToSquare(x, y) {
  if (x < 0 || x > 7 || y < 0 || y > 7) return null;
  return String.fromCharCode(97 + x) + String(y + 1);
}

export function findAttackersOfSquare(game, targetSquare, attackerColor) {
  const attackers = new Set();
  const target = squareToXY(targetSquare);
  if (!target) return attackers;

  const { x: tx, y: ty } = target;
  const collectIfMatch = (x, y, type) => {
    const square = xyToSquare(x, y);
    if (!square) return false;
    const piece = game.get(square);
    if (piece?.color === attackerColor && piece.type === type) {
      attackers.add(square);
      return true;
    }
    return false;
  };

  const pawnDy = attackerColor === 'w' ? -1 : 1;
  collectIfMatch(tx - 1, ty + pawnDy, 'p');
  collectIfMatch(tx + 1, ty + pawnDy, 'p');

  const knightDeltas = [
    [-1, -2], [1, -2],
    [-2, -1], [2, -1],
    [-2, 1], [2, 1],
    [-1, 2], [1, 2],
  ];

  for (const [dx, dy] of knightDeltas) {
    collectIfMatch(tx + dx, ty + dy, 'n');
  }

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      collectIfMatch(tx + dx, ty + dy, 'k');
    }
  }

  const scan = (dx, dy, pieceTypes) => {
    let x = tx + dx;
    let y = ty + dy;

    while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
      const square = xyToSquare(x, y);
      if (!square) break;

      const piece = game.get(square);
      if (piece) {
        if (piece.color === attackerColor && pieceTypes.includes(piece.type)) {
          attackers.add(square);
        }
        break;
      }

      x += dx;
      y += dy;
    }
  };

  scan(-1, -1, ['b', 'q']);
  scan(1, -1, ['b', 'q']);
  scan(-1, 1, ['b', 'q']);
  scan(1, 1, ['b', 'q']);
  scan(-1, 0, ['r', 'q']);
  scan(1, 0, ['r', 'q']);
  scan(0, -1, ['r', 'q']);
  scan(0, 1, ['r', 'q']);

  return attackers;
}

export function getEngineCandidates() {
  return [
    {
      id: 'custom-sf',
      label: 'Custom Stockfish',
      description: 'Stockfish.js from local folder',
      path: '/stockfish/stockfish.js',
      hash: 32,
    },
    {
      id: 'lite-js',
      label: 'Stockfish.js Lite',
      description: 'Local JS engine build (lite)',
      path: '/stockfish/lite/stockfish.js',
      hash: 16,
    }
  ];
}
