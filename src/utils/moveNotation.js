/**
 * Chess Move Notation Utilities
 * Converts between coordinate notation and Standard Algebraic Notation (SAN)
 */

import { Chess } from 'chess.js';

/**
 * Convert a coordinate move to Standard Algebraic Notation (SAN)
 * @param {Chess} chess - Chess game instance
 * @param {string|{from: string, to: string, promotion?: string}} move - Move in coordinate format or object
 * @returns {string} Move in SAN format (e.g., "e4", "Nf3", "O-O")
 */
export function coordinateToSAN(chess, move) {
  try {
    if (typeof move === 'string') {
      // Parse coordinate notation: e2e4, e1g1, etc.
      if (move.length < 4) return move;
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length >= 5 ? move[4] : undefined;
      return coordinateToSAN(chess, { from, to, promotion });
    }

    const { from, to, promotion } = move;
    if (!from || !to) return '';

    // Create a copy to avoid modifying the original
    const testGame = new Chess(chess.fen());
    const moveResult = testGame.move({ from, to, promotion });
    
    if (!moveResult) {
      console.warn(`Invalid move: ${from}${to}`);
      return '';
    }

    return moveResult.san;
  } catch (error) {
    console.error('Error converting coordinate to SAN:', error);
    return '';
  }
}

/**
 * Convert a PV string (spaces-separated coordinate moves) to SAN notation
 * @param {Chess} chess - Chess game instance
 * @param {string} pvCoordinates - PV string with coordinate moves separated by spaces (e.g., "e2e4 e7e5 g1f3")
 * @returns {string} PV in SAN format (e.g., "e4 e5 Nf3")
 */
export function pvCoordinatesToSAN(chess, pvCoordinates) {
  if (!pvCoordinates || typeof pvCoordinates !== 'string') return '';
  
  try {
    const pvMoves = pvCoordinates.split(' ').filter(m => m && m.length >= 4);
    const sanMoves = [];
    
    // Clone the starting position to simulate the PV line
    const game = new Chess(chess.fen());
    
    for (const move of pvMoves) {
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      
      const moveObj = game.move({ from, to, promotion });
      if (moveObj) {
        sanMoves.push(moveObj.san);
      } else {
        // Stop if illegal move is encountered
        console.warn(`Illegal PV move: ${from}${to} in position: ${game.fen()}`);
        break;
      }
    }
    
    return sanMoves.join(' ');
  } catch (error) {
    console.error('Error converting PV to SAN:', error);
    return '';
  }
}

/**
 * Format a list of moves as PGN notation with move numbers
 * @param {Array<{from: string, to: string, san: string}>} moves - Array of move objects with san property
 * @returns {string} PGN-formatted string
 */
export function movesToPGN(moves) {
  if (!moves || moves.length === 0) return '';

  let pgn = '';
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const isWhiteMove = i % 2 === 0;
    
    if (isWhiteMove) {
      const moveNum = Math.floor(i / 2) + 1;
      pgn += `${moveNum}. `;
    }
    
    pgn += `${move.san} `;
  }

  return pgn.trim();
}

/**
 * Convert PGN notation or move list to full detailed move objects
 * @param {string} pgn - PGN string or single move in SAN
 * @param {string} startFen - Starting FEN (defaults to start position)
 * @returns {Array<{san: string, from: string, to: string, promotion?: string}>} Array of move objects
 */
export function pgnToMoves(pgn, startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
  try {
    const game = new Chess(startFen);
    const moves = [];

    // Extract move numbers and moves from PGN
    const movePattern = /\d+\.\s*([A-Za-z0-9\-=+#]+)\s*([A-Za-z0-9\-=+#]+)?/g;
    let match;

    while ((match = movePattern.exec(pgn)) !== null) {
      // White move
      if (match[1]) {
        const move = game.move(match[1], { sloppy: true });
        if (move) {
          moves.push({
            san: move.san,
            from: move.from,
            to: move.to,
            promotion: move.promotion
          });
        }
      }

      // Black move
      if (match[2]) {
        const move = game.move(match[2], { sloppy: true });
        if (move) {
          moves.push({
            san: move.san,
            from: move.from,
            to: move.to,
            promotion: move.promotion
          });
        }
      }
    }

    return moves;
  } catch (error) {
    console.error('Error parsing PGN:', error);
    return [];
  }
}

/**
 * Check if a move string is in coordinate notation
 * @param {string} moveStr - Move string to check
 * @returns {boolean}
 */
export function isCoordinateNotation(moveStr) {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(moveStr);
}

/**
 * Check if a move string is in SAN notation (Standard Algebraic Notation)
 * @param {string} moveStr - Move string to check
 * @returns {boolean}
 */
export function isStandardAlgebraicNotation(moveStr) {
  // SAN patterns: e4, Nf3, exd4, O-O, O-O-O, etc.
  return /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$|^O-O(?:-O)?[+#]?$/.test(moveStr);
}
