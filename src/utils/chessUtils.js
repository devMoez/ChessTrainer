// Centralized chess utility functions used across multiple components

export function toggleTurn(turn) {
  return turn === 'b' ? 'w' : 'b';
}

export function clampThinkingTime(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(60, Math.round(value)));
}

export function clampHumanizeElo(value, defaultValue = 1200) {
  if (!Number.isFinite(value)) return defaultValue;
  return Math.max(600, Math.min(2600, Math.round(value)));
}

export function getMateEvalPercent(score) {
  if (typeof score !== 'string') return 50;
  if (/^-M\d+$/i.test(score)) return 0;
  if (/^M\d+$/i.test(score)) return 100;
  return 50;
}

export function scoreToPercent(score) {
  if (!score || score === '0.0' || score === '+0.0') return 50;
  
  if (/^-?M\d+$/i.test(score)) {
    return getMateEvalPercent(score);
  }
  
  const numeric = Number.parseFloat(score);
  if (!Number.isFinite(numeric)) return 50;
  
  const clamped = Math.max(-10, Math.min(10, numeric));
  return 50 + (clamped / 20) * 100;
}

export function shallowEvalEqual(a, b) {
  return a.bestMove === b.bestMove && 
         a.score === b.score && 
         a.depth === b.depth && 
         a.pv === b.pv;
}

export function getHumanizeWeights(elo) {
  if (elo <= 900) return [0.34, 0.24, 0.18, 0.14, 0.10];
  if (elo <= 1300) return [0.48, 0.22, 0.14, 0.10, 0.06];
  if (elo <= 1700) return [0.63, 0.20, 0.09, 0.05, 0.03];
  if (elo <= 2100) return [0.78, 0.13, 0.05, 0.025, 0.015];
  return [0.9, 0.07, 0.02, 0.01, 0.0];
}

export function chooseHumanizedMove(candidates, elo) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const weights = getHumanizeWeights(elo).slice(0, candidates.length);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (!totalWeight) return candidates[0];

  let threshold = Math.random() * totalWeight;
  for (let index = 0; index < candidates.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) return candidates[index];
  }

  return candidates[0];
}

export function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function positionMapFromFen(fen, defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
  const board = `${fen || defaultFen}`.trim().split(/\s+/)[0] || defaultFen.split(' ')[0];
  const rows = board.split('/');
  const position = new Map();

  rows.forEach((row, rowIndex) => {
    let file = 0;
    for (const symbol of row) {
      if (/\d/.test(symbol)) {
        file += Number(symbol);
        continue;
      }

      const square = `${String.fromCharCode(97 + file)}${8 - rowIndex}`;
      position.set(square, {
        color: symbol === symbol.toLowerCase() ? 'b' : 'w',
        type: symbol.toLowerCase(),
      });
      file += 1;
    }
  });

  return position;
}

export function boardStringFromPositionMap(position) {
  const rows = [];

  for (let rank = 8; rank >= 1; rank -= 1) {
    let empties = 0;
    let row = '';

    for (let file = 0; file < 8; file += 1) {
      const square = `${String.fromCharCode(97 + file)}${rank}`;
      const piece = position.get(square);

      if (!piece) {
        empties += 1;
        continue;
      }

      if (empties > 0) {
        row += empties;
        empties = 0;
      }

      const symbol = piece.type;
      row += piece.color === 'w' ? symbol.toUpperCase() : symbol;
    }

    if (empties > 0) row += empties;
    rows.push(row);
  }

  return rows.join('/');
}
