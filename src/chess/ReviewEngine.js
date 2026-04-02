import { Chess } from 'chess.js';
import { coordinateToSAN } from '../utils/moveNotation.js';
import { DEFAULT_FEN, formatEngineScore, parseUciMove } from './analysisHelpers.js';

const LARGE_MATE_CP = 10000;
const CATEGORY_RULES = [
  { key: 'best', label: 'Best', maxLoss: 15 },
  { key: 'excellent', label: 'Excellent', maxLoss: 45 },
  { key: 'good', label: 'Good', maxLoss: 95 },
  { key: 'inaccuracy', label: 'Inaccuracy', maxLoss: 180 },
  { key: 'mistake', label: 'Mistake', maxLoss: 320 },
  { key: 'blunder', label: 'Blunder', maxLoss: Number.POSITIVE_INFINITY },
];

function scoreTextToWhiteCp(scoreText) {
  if (typeof scoreText !== 'string' || !scoreText) return 0;

  if (/^-M\d+$/i.test(scoreText)) return -LARGE_MATE_CP;
  if (/^M\d+$/i.test(scoreText)) return LARGE_MATE_CP;

  const numeric = Number.parseFloat(scoreText);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

function scoreToPercent(scoreText) {
  if (/^-M\d+$/i.test(scoreText)) return 0;
  if (/^M\d+$/i.test(scoreText)) return 100;

  const numeric = Number.parseFloat(scoreText);
  if (!Number.isFinite(numeric)) return 50;

  const clamped = Math.max(-10, Math.min(10, numeric));
  return 50 + (clamped / 20) * 100;
}

function perspectiveScore(scoreText, color) {
  const whiteScore = scoreTextToWhiteCp(scoreText);
  return color === 'b' ? -whiteScore : whiteScore;
}

function categorizeLoss(loss) {
  return CATEGORY_RULES.find((rule) => loss <= rule.maxLoss) ?? CATEGORY_RULES[CATEGORY_RULES.length - 1];
}

function accuracyFromLoss(loss) {
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-loss / 260))));
}

function summarizeMoves(reviewedMoves) {
  const counts = CATEGORY_RULES.reduce((summary, rule) => ({
    ...summary,
    [rule.key]: 0,
  }), {});

  reviewedMoves.forEach((move) => {
    counts[move.category] += 1;
  });

  return counts;
}

function buildInsight({ accuracy, counts, moveCount }) {
  const strongMoves = counts.best + counts.excellent + counts.good;
  const majorErrors = counts.mistake + counts.blunder;

  if (moveCount === 0) {
    return 'No moves were available to review yet.';
  }

  if (majorErrors === 0) {
    return `This was a clean game with ${strongMoves} strong moves and no major tactical collapses. Your overall accuracy landed at ${accuracy}%, which is a strong review score.`;
  }

  if (counts.blunder > 0) {
    return `The biggest swing came from ${counts.blunder} blunder${counts.blunder === 1 ? '' : 's'}, which overshadowed an otherwise solid ${accuracy}% accuracy game. Tightening calculation before forcing moves would raise the floor quickly.`;
  }

  return `You produced ${strongMoves} solid moves, but ${majorErrors} mistakes or inaccuracies cost the smoothest plans. At ${accuracy}% accuracy, the game was competitive and mainly needs cleaner conversion in the critical moments.`;
}

function normalizeMoves(initialFen, moves) {
  const chess = new Chess(initialFen);

  return (moves || []).map((move, index) => {
    let result = null;

    if (move?.from && move?.to) {
      result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });
    } else if (move?.uci) {
      const parsed = parseUciMove(move.uci);
      if (!parsed) {
        throw new Error(`Invalid move at ply ${index + 1}.`);
      }
      result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion || 'q',
      });
    } else if (move?.san) {
      result = chess.move(move.san);
    }

    if (!result) {
      throw new Error(`Unable to replay move ${index + 1}.`);
    }

    return {
      san: result.san,
      from: result.from,
      to: result.to,
      color: result.color,
      promotion: result.promotion,
      fen: chess.fen(),
    };
  });
}

export default class ReviewEngine {
  constructor({ workerPath = '/stockfish/stockfish-17.1-lite-single-03e3232.js', depth = 10 } = {}) {
    this.workerPath = workerPath;
    this.depth = depth;
    this.worker = null;
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
    this.currentRequest = null;
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  ensureReady() {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;

      const worker = new Worker(this.workerPath);
      this.worker = worker;
      worker.addEventListener('message', this.handleMessage);
      worker.addEventListener('error', this.handleError);
      worker.postMessage('uci');
    });

    return this.readyPromise;
  }

  handleMessage(event) {
    const line = String(event?.data ?? '').trim();
    if (!line) return;

    if (line === 'uciok') {
      this.worker?.postMessage('setoption name Threads value 2');
      this.worker?.postMessage('setoption name Hash value 64');
      this.worker?.postMessage('isready');
      return;
    }

    if (line === 'readyok') {
      this.readyResolve?.();
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }

    if (line.startsWith('info ') && this.currentRequest) {
      const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
      const depthMatch = line.match(/\bdepth\s+(\d+)/);
      const pvCoordinates = line.match(/\bpv\s+(.+)$/)?.[1]?.trim() || '';
      const bestMove = pvCoordinates.split(' ')[0] || this.currentRequest.latest.bestMove;

      if (scoreMatch) {
        this.currentRequest.latest.scoreText = formatEngineScore(scoreMatch[1], scoreMatch[2]);
      }

      if (depthMatch) {
        this.currentRequest.latest.depth = depthMatch[1];
      }

      if (pvCoordinates) {
        this.currentRequest.latest.pv = pvCoordinates;
      }

      if (bestMove) {
        this.currentRequest.latest.bestMove = bestMove;
      }
      return;
    }

    if (line.startsWith('bestmove ') && this.currentRequest) {
      const request = this.currentRequest;
      this.currentRequest = null;

      const bestMove = line.match(/^bestmove\s+(\S+)/)?.[1] || request.latest.bestMove || '';
      const parsedBestMove = parseUciMove(bestMove);

      let bestSan = '--';
      if (parsedBestMove) {
        try {
          const reviewGame = new Chess(request.fen);
          bestSan = coordinateToSAN(reviewGame, bestMove) || bestMove;
        } catch {
          bestSan = bestMove;
        }
      }

      request.resolve({
        fen: request.fen,
        scoreText: request.latest.scoreText,
        depth: request.latest.depth,
        pv: request.latest.pv,
        bestMove,
        bestMoveParsed: parsedBestMove,
        bestSan,
      });
    }
  }

  handleError(error) {
    if (this.currentRequest) {
      this.currentRequest.reject(error);
      this.currentRequest = null;
    }

    this.readyReject?.(error);
    this.readyResolve = null;
    this.readyReject = null;
  }

  evaluateFen(fen, depth = this.depth) {
    return this.ensureReady().then(() => new Promise((resolve, reject) => {
      this.currentRequest = {
        fen,
        resolve,
        reject,
        latest: {
          scoreText: '0.0',
          depth: '0',
          pv: '',
          bestMove: '',
        },
      };

      this.worker?.postMessage('stop');
      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);
    }));
  }

  async analyzeGame({ initialFen = DEFAULT_FEN, moves = [], depth = this.depth } = {}) {
    const normalizedMoves = normalizeMoves(initialFen, moves);
    const positions = [{ fen: initialFen }];

    normalizedMoves.forEach((move) => {
      positions.push({ fen: move.fen });
    });

    const evaluations = [];
    for (const position of positions) {
      // Sequential engine requests keep the worker interaction deterministic.
      const evaluation = await this.evaluateFen(position.fen, depth);
      evaluations.push(evaluation);
    }

    const reviewedMoves = normalizedMoves.map((move, index) => {
      const before = evaluations[index];
      const after = evaluations[index + 1];
      const loss = Math.max(
        0,
        perspectiveScore(before.scoreText, move.color) - perspectiveScore(after.scoreText, move.color)
      );
      const roundedLoss = Math.round(loss);
      const category = categorizeLoss(roundedLoss);

      return {
        ...move,
        index,
        loss: roundedLoss,
        accuracy: accuracyFromLoss(roundedLoss),
        category: category.key,
        categoryLabel: category.label,
        beforeScore: before.scoreText,
        afterScore: after.scoreText,
        bestMove: before.bestMoveParsed
          ? {
              ...before.bestMoveParsed,
              san: before.bestSan,
            }
          : null,
        bestSan: before.bestSan,
        pv: before.pv,
      };
    });

    const counts = summarizeMoves(reviewedMoves);
    const accuracy = reviewedMoves.length
      ? Math.round(reviewedMoves.reduce((sum, move) => sum + move.accuracy, 0) / reviewedMoves.length)
      : 0;

    return {
      initialFen,
      depth,
      accuracy,
      insight: buildInsight({
        accuracy,
        counts,
        moveCount: reviewedMoves.length,
      }),
      counts,
      positions: positions.map((position, index) => ({
        ...position,
        evaluation: {
          ...evaluations[index],
          whiteCp: scoreTextToWhiteCp(evaluations[index].scoreText),
          percent: scoreToPercent(evaluations[index].scoreText),
        },
      })),
      moves: reviewedMoves,
    };
  }

  destroy() {
    if (this.currentRequest) {
      this.currentRequest.reject(new Error('Review engine closed before completion.'));
      this.currentRequest = null;
    }

    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.removeEventListener('error', this.handleError);
      this.worker.terminate();
      this.worker = null;
    }

    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
  }
}
