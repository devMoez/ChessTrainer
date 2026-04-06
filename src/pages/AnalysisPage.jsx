import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Chess } from 'chess.js';
import { useApp } from '../context/AppContext.jsx';
import ChessBoard from '../components/ChessBoard.jsx';
import EvalBar from '../components/EvalBar.jsx';
import ExtraPiecesTrayRow from '../components/ExtraPiecesTray.jsx';
import GameResultModal from '../components/GameResultModal.jsx';
import AnalysisSettingsModal from '../components/AnalysisSettingsModal.jsx';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';
import useChessDragClass from '../hooks/useChessDragClass.js';
import { coordinateToSAN, pvCoordinatesToSAN } from '../utils/moveNotation.js';
import {
  BrokenCrownIcon,
  CrownIcon,
  DrawEmblemIcon,
  HourglassIcon,
  WhiteFlagIcon,
} from '../components/PremiumResultIcons.jsx';
import {
  BLACK_PIECES,
  BOARD_SQUARES,
  DEFAULT_CASTLING,
  DEFAULT_FEN,
  WHITE_PIECES,
  castlingStateFromFen,
  colorName,
  computeGameResult,
  findAttackersOfSquare,
  findKingSquare,
  formatEngineScore,
  getEngineCandidates,
  isBoardSquare,
  isDrawReason,
  parseUciMove,
  rebuildFen,
  stripEnPassant,
} from '../chess/analysisHelpers.js';

const DEFAULT_BOARD_PX = 756;
const EMPTY_EVAL = Object.freeze({ bestMove: '', score: '0.0', depth: '0', pv: '' });
const DEFAULT_HUMANIZE_ELO = 3200;
const ENGINE_ARROW_STYLES = Object.freeze([
  { color: 'rgba(76, 175, 80, 0.88)', tone: 'green' },
  { color: 'rgba(76, 143, 230, 0.84)', tone: 'blue' },
  { color: 'rgba(244, 143, 76, 0.84)', tone: 'orange' },
  { color: 'rgba(155, 89, 182, 0.82)', tone: 'purple' },
  { color: 'rgba(229, 57, 53, 0.82)', tone: 'red' },
]);

function shallowEvalEqual(a, b) {
  return a.bestMove === b.bestMove && a.score === b.score && a.depth === b.depth && a.pv === b.pv;
}

function clampThinkingTime(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(60, Math.round(value)));
}

function clampHumanizeElo(value) {
  if (!Number.isFinite(value)) return DEFAULT_HUMANIZE_ELO;
  return Math.max(600, Math.min(3200, Math.round(value)));
}

function toggleTurn(turn) {
  return turn === 'b' ? 'w' : 'b';
}

function getMateEvalPercent(score) {
  if (typeof score !== 'string') return 50;
  if (/^-M\d+$/i.test(score)) return 0;
  if (/^M\d+$/i.test(score)) return 100;
  return 50;
}

function getDesiredMultiPv({ showTopMoves }) {
  return showTopMoves ? 5 : 1;
}

function getHumanizeWeights(elo) {
  if (elo <= 900) return [0.34, 0.24, 0.18, 0.14, 0.10];
  if (elo <= 1300) return [0.48, 0.22, 0.14, 0.10, 0.06];
  if (elo <= 1700) return [0.63, 0.20, 0.09, 0.05, 0.03];
  if (elo <= 2100) return [0.78, 0.13, 0.05, 0.025, 0.015];
  if (elo <= 2600) return [0.9, 0.07, 0.02, 0.01, 0.0];
  if (elo <= 3000) return [0.92, 0.05, 0.02, 0.01, 0.0];
  return [0.94, 0.04, 0.015, 0.005, 0.0]; // 3200+ Super GM - still humanized
}

function chooseHumanizedMove(candidates, elo) {
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

function positionMapFromFen(fen) {
  const board = `${fen || DEFAULT_FEN}`.trim().split(/\s+/)[0] || DEFAULT_FEN.split(' ')[0];
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

function boardStringFromPositionMap(position) {
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
        row += String(empties);
        empties = 0;
      }

      const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
      row += symbol;
    }

    if (empties > 0) row += String(empties);
    rows.push(row || '8');
  }

  return rows.join('/');
}

function getSquareCenter(square, boardSize, orientation) {
  if (!isBoardSquare(square) || !Number.isFinite(boardSize) || boardSize <= 0) return null;

  const file = square.charCodeAt(0) - 97;
  const rank = Number.parseInt(square[1], 10);
  if (!Number.isFinite(file) || !Number.isFinite(rank)) return null;

  const normalizedFile = orientation === 'black' ? 7 - file : file;
  const normalizedRank = orientation === 'black' ? rank - 1 : 8 - rank;
  const squareSize = boardSize / 8;

  return {
    x: normalizedFile * squareSize + squareSize / 2,
    y: normalizedRank * squareSize + squareSize / 2,
  };
}

function getArrowLabelAnchor(fromSquare, toSquare, boardSize, orientation) {
  const from = getSquareCenter(fromSquare, boardSize, orientation);
  const to = getSquareCenter(toSquare, boardSize, orientation);
  if (!from || !to) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!length) return to;

  const squareSize = boardSize / 8;
  const retreat = Math.min(squareSize * 0.44, length * 0.28);

  return {
    x: to.x - (dx / length) * retreat,
    y: to.y - (dy / length) * retreat,
  };
}

function sanitizeEngineHints(hints) {
  if (!Array.isArray(hints)) return [];

  return hints.filter((hint) => (
    isBoardSquare(hint?.from) && isBoardSquare(hint?.to)
  ));
}

export default function AnalysisPage() {
  const {
    showEvalBar,
    showLegalDots,
    autoEnPassant,
  } = useApp();

  const gameRef = useRef(new Chess(DEFAULT_FEN));
  const engineRef = useRef(null);
  const latestFenRef = useRef(DEFAULT_FEN);
  const calculatingRef = useRef(false);
  const suppressAutoAnalyzeRef = useRef(false);
  const engineMoveApplierRef = useRef(() => { });
  const engineCandidatesRef = useRef(getEngineCandidates());
  const engineLineCacheRef = useRef(new Map());
  const humanizeMovesRef = useRef(false);
  const humanizeEloRef = useRef(DEFAULT_HUMANIZE_ELO);
  const analysisContextRef = useRef({ id: 0, fen: DEFAULT_FEN, mode: 'show', started: false });

  const [fen, setFen] = useState(DEFAULT_FEN);
  const [fenInput, setFenInput] = useState(DEFAULT_FEN);
  const [fenError, setFenError] = useState('');
  const [orientation, setOrientation] = useState('white');
  const [sideToMove, setSideToMove] = useState('w');
  const [castling, setCastling] = useState(DEFAULT_CASTLING);
  const [moves, setMoves] = useState([]);
  const [showMove, setShowMove] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState(true);
  const [showTopMoves, setShowTopMoves] = useState(false);
  const [humanizeMoves, setHumanizeMoves] = useState(false);
  const [humanizeElo, setHumanizeElo] = useState(DEFAULT_HUMANIZE_ELO);
  const [engineReady, setEngineReady] = useState(false);
  const [engineProfile, setEngineProfile] = useState(null);
  const [engineError, setEngineError] = useState('');
  const [engineHints, setEngineHints] = useState([]);
  const [evalData, setEvalData] = useState(EMPTY_EVAL);
  const [thinkingTime, setThinkingTime] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [boardPx, setBoardPx] = useState(DEFAULT_BOARD_PX);
  const [gameResult, setGameResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const deferredPv = useDeferredValue(evalData.pv);

  useEffect(() => {
    latestFenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    calculatingRef.current = isCalculating;
  }, [isCalculating]);

  useEffect(() => {
    humanizeMovesRef.current = humanizeMoves;
    humanizeEloRef.current = humanizeElo;
  }, [humanizeElo, humanizeMoves]);

  useEffect(() => {
    setFenInput(fen);
  }, [fen]);

  const squarePx = useMemo(() => Math.max(1, boardPx / 8), [boardPx]);

  const boardGame = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [fen]);

  const kingSquares = useMemo(() => {
    if (!boardGame) return { w: null, b: null };
    return {
      w: findKingSquare(boardGame, 'w'),
      b: findKingSquare(boardGame, 'b'),
    };
  }, [boardGame]);

  const checkSquare = useMemo(() => {
    if (!boardGame || !boardGame.isCheck()) return null;
    return findKingSquare(boardGame, boardGame.turn());
  }, [boardGame]);

  const checkAttackers = useMemo(() => {
    if (!boardGame || !checkSquare) return new Set();
    const attackerColor = boardGame.turn() === 'w' ? 'b' : 'w';
    return findAttackersOfSquare(boardGame, checkSquare, attackerColor);
  }, [boardGame, checkSquare]);

  const legalTargetsBySquare = useMemo(() => {
    const bySquare = new Map();
    for (const move of legalMoves) {
      const movesAtSquare = bySquare.get(move.to);
      if (movesAtSquare) {
        movesAtSquare.push(move);
      } else {
        bySquare.set(move.to, [move]);
      }
    }
    return bySquare;
  }, [legalMoves]);

  const captureTargets = useMemo(() => {
    const targets = new Set();
    for (const move of legalMoves) {
      if (move.captured) targets.add(move.to);
    }
    return targets;
  }, [legalMoves]);

  const kingBadges = useMemo(() => {
    const badges = new Map();
    if (!gameResult) return badges;

    if (isDrawReason(gameResult.reason)) {
      if (kingSquares.w) {
        badges.set(kingSquares.w, { variant: 'draw', icon: <DrawEmblemIcon className="king-badge-icon" /> });
      }
      if (kingSquares.b) {
        badges.set(kingSquares.b, { variant: 'draw', icon: <DrawEmblemIcon className="king-badge-icon" /> });
      }
      return badges;
    }

    const winnerSquare = gameResult.winner === 'w' ? kingSquares.w : kingSquares.b;
    const loserSquare = gameResult.loser === 'w' ? kingSquares.w : kingSquares.b;

    if (winnerSquare) {
      badges.set(winnerSquare, { variant: 'win', icon: <CrownIcon className="king-badge-icon" /> });
    }

    if (loserSquare) {
      if (gameResult.reason === 'timeout') {
        badges.set(loserSquare, { variant: 'timeout', icon: <HourglassIcon className="king-badge-icon" /> });
      } else if (gameResult.reason === 'resign') {
        badges.set(loserSquare, { variant: 'resign', icon: <WhiteFlagIcon className="king-badge-icon" /> });
      } else {
        badges.set(loserSquare, { variant: 'lose', icon: <BrokenCrownIcon className="king-badge-icon" /> });
      }
    }

    return badges;
  }, [gameResult, kingSquares.b, kingSquares.w]);

  const displayScore = useMemo(() => {
    const score = evalData.score;
    if (!score) return '0.0';

    if (/^-?M\d+$/i.test(score)) {
      return sideToMove === 'w'
        ? score
        : (score.startsWith('-') ? score.slice(1) : `-${score}`);
    }

    const numeric = Number.parseFloat(score);
    if (!Number.isFinite(numeric)) return '0.0';

    const whitePerspective = sideToMove === 'w' ? numeric : -numeric;
    const normalized = Math.abs(whitePerspective) < 0.05 ? 0 : whitePerspective;
    return `${normalized > 0 ? '+' : ''}${normalized.toFixed(1)}`;
  }, [evalData.score, sideToMove]);

  const evalPercent = useMemo(() => {
    if (!displayScore || displayScore === '0.0' || displayScore === '+0.0') return 50;

    if (/^-?M\d+$/i.test(displayScore)) {
      return getMateEvalPercent(displayScore);
    }

    const numeric = Number.parseFloat(displayScore);
    if (!Number.isFinite(numeric)) return 50;

    const clamped = Math.max(-10, Math.min(10, numeric));
    return 50 + (clamped / 20) * 100;
  }, [displayScore]);

  const displayedEngineHints = useMemo(() => {
    const validHints = sanitizeEngineHints(engineHints);

    if (showTopMoves) return validHints.slice(0, ENGINE_ARROW_STYLES.length);
    if (showBestMoveArrow) return validHints.slice(0, 1);
    return [];
  }, [engineHints, showBestMoveArrow, showTopMoves]);

  const engineArrows = useMemo(() => displayedEngineHints.map((hint, index) => ({
    startSquare: hint.from,
    endSquare: hint.to,
    color: ENGINE_ARROW_STYLES[index]?.color ?? ENGINE_ARROW_STYLES[0].color,
  })), [displayedEngineHints]);

  const engineArrowCallouts = useMemo(() => {
    if (!showTopMoves || !Number.isFinite(boardPx) || boardPx <= 0) return [];

    return displayedEngineHints.map((hint, index) => {
      const anchor = getArrowLabelAnchor(hint.from, hint.to, boardPx, orientation);
      if (!anchor) return null;

      return {
        id: `${hint.from}-${hint.to}-${index + 1}`,
        color: ENGINE_ARROW_STYLES[index]?.color ?? ENGINE_ARROW_STYLES[0].color,
        label: `${index + 1}`,
        x: anchor.x,
        y: anchor.y,
      };
    }).filter(Boolean);
  }, [boardPx, displayedEngineHints, orientation, showTopMoves]);

  const topTrayPieces = orientation === 'white' ? BLACK_PIECES : WHITE_PIECES;
  const bottomTrayPieces = orientation === 'white' ? WHITE_PIECES : BLACK_PIECES;
  const recentMoves = useMemo(() => moves.slice(-8).map(move => move.san).join(' '), [moves]);
  const gameStatusText = gameResult
    ? (gameResult.title || gameResult.reason)
    : (isCalculating ? 'Analyzing' : (engineReady ? 'Ready' : 'Loading engine'));

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const resetEvalState = useCallback((clearHints = true) => {
    startTransition(() => setEvalData(EMPTY_EVAL));
    engineLineCacheRef.current = new Map();
    if (clearHints) setEngineHints([]);
  }, []);

  const stopEngine = useCallback((clearHints = false) => {
    analysisContextRef.current = {
      ...analysisContextRef.current,
      id: analysisContextRef.current.id + 1,
      started: false,
    };
    calculatingRef.current = false;
    setIsCalculating(false);

    // Stop the engine asynchronously to avoid blocking the main thread
    if (engineRef.current?.postMessage) {
      engineRef.current.postMessage('stop');
    }

    if (clearHints) {
      engineLineCacheRef.current = new Map();
      startTransition(() => setEngineHints([]));
    }
  }, []);

  const prepareBoardMutation = useCallback(() => {
    stopEngine(true);
    resetEvalState();
    setFenError('');
    setGameResult(null);
    setIsResultModalOpen(false);
  }, [resetEvalState, stopEngine]);

  const updateEvalData = useCallback((partial) => {
    if (!partial || typeof partial !== 'object') return;

    startTransition(() => {
      setEvalData(prev => {
        const next = { ...prev, ...partial };
        return shallowEvalEqual(prev, next) ? prev : next;
      });
    });
  }, []);

  const commitPosition = useCallback((sourceFen, options = {}) => {
    const {
      moveResult = null,
      resetMoves = !moveResult,
      turnOverride,
      castlingOverride,
      lastMoveOverride = moveResult ? { from: moveResult.from, to: moveResult.to } : null,
      resultOverride,
    } = options;

    const normalizedFen = autoEnPassant ? sourceFen : stripEnPassant(sourceFen);
    const finalFen = rebuildFen(normalizedFen, {
      turn: turnOverride,
      castlingState: castlingOverride,
    });
    let finalGame = null;
    try {
      finalGame = new Chess(finalFen);
    } catch {
      finalGame = null;
    }

    gameRef.current = finalGame;
    setFen(finalFen);
    setSideToMove(finalGame?.turn?.() ?? (finalFen.split(/\s+/)[1] || 'w'));
    setCastling(castlingOverride ?? castlingStateFromFen(finalFen));
    setLastMove(lastMoveOverride);
    setFenError('');
    clearSelection();

    // Reset best move arrow when a new move is played
    setEngineHints([]);

    // Defer non-critical UI updates (move list, results) to keep the board responsive
    startTransition(() => {
      if (resetMoves) {
        setMoves([]);
      } else if (moveResult) {
        setMoves(prev => [
          ...prev,
          {
            san: moveResult.san,
            from: moveResult.from,
            to: moveResult.to,
            promotion: moveResult.promotion,
            color: moveResult.color,
            fen: finalFen,
          },
        ]);
      }

      const nextResult = resultOverride === undefined
        ? (finalGame ? computeGameResult(finalGame) : null)
        : resultOverride;
      setGameResult(nextResult);
      setIsResultModalOpen(Boolean(nextResult));
    });
  }, [autoEnPassant, clearSelection]);

  const parseEngineHint = useCallback((line, analysisFen) => {
    const pvCoordinates = line.match(/\bpv\s+(.+)$/)?.[1]?.trim();
    if (!pvCoordinates) return null;

    const primaryUci = pvCoordinates.split(' ')[0];
    const parsedMove = parseUciMove(primaryUci);
    if (!parsedMove) return null;

    const rank = Number.parseInt(line.match(/\bmultipv\s+(\d+)/)?.[1] ?? '1', 10);
    const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
    let analysisGame = null;
    try {
      analysisGame = new Chess(analysisFen);
    } catch {
      analysisGame = null;
    }

    return {
      rank: Number.isFinite(rank) ? rank : 1,
      uci: primaryUci,
      from: parsedMove.from,
      to: parsedMove.to,
      san: analysisGame ? (coordinateToSAN(analysisGame, primaryUci) || primaryUci) : primaryUci,
      score: scoreMatch ? formatEngineScore(scoreMatch[1], scoreMatch[2]) : '0.0',
      pv: analysisGame ? (pvCoordinatesToSAN(analysisGame, pvCoordinates) || pvCoordinates) : pvCoordinates,
    };
  }, []);

  const applyEngineMove = useCallback((uciMove) => {
    const parsedMove = parseUciMove(uciMove);
    if (!parsedMove) return;

    const liveFen = latestFenRef.current;
    let boardState = null;
    try {
      boardState = new Chess(liveFen);
    } catch {
      return;
    }
    const movingPiece = boardState.get(parsedMove.from);
    if (!movingPiece) return;

    const moveGame = new Chess(rebuildFen(liveFen, { turn: movingPiece.color }));
    const moveResult = moveGame.move({
      from: parsedMove.from,
      to: parsedMove.to,
      promotion: parsedMove.promotion || (movingPiece.type === 'p' && /[18]$/.test(parsedMove.to) ? 'q' : undefined),
    });

    if (!moveResult) return;

    suppressAutoAnalyzeRef.current = true;
    prepareBoardMutation();
    commitPosition(moveGame.fen(), {
      moveResult,
      resetMoves: false,
      turnOverride: toggleTurn(sideToMove),
    });
  }, [commitPosition, prepareBoardMutation, sideToMove]);

  engineMoveApplierRef.current = applyEngineMove;

  const startEngineAnalysis = useCallback((targetFen = latestFenRef.current) => {
    if (!engineReady || !engineRef.current) return false;

    const requestId = analysisContextRef.current.id + 1;
    // MultiPV is already set to 1 during initialization
    const desiredMultiPv = getDesiredMultiPv({ showTopMoves, humanizeMoves });

    analysisContextRef.current = {
      id: requestId,
      fen: targetFen,
      mode: showMove ? 'show' : 'make',
      started: true,
    };

    engineLineCacheRef.current = new Map();
    calculatingRef.current = true;

    // Use startTransition for analysis-related UI updates
    startTransition(() => {
      setIsCalculating(true);
      updateEvalData({
        bestMove: '...',
        depth: '0',
        pv: '',
      });
    });

    // Send minimal commands for maximum speed
    // Do NOT call 'ucinewgame' as it clears the hash table and slows analysis
    console.log("ENGINE START ANALYSIS", targetFen);
    engineRef.current.postMessage('stop');
    console.log("ENGINE COMMAND: stop");

    // Configure MultiPV before starting analysis
    const multipv = showTopMoves ? 5 : 1;
    engineRef.current.postMessage(`setoption name MultiPV value ${multipv}`);
    console.log(`ENGINE COMMAND: setoption name MultiPV value ${multipv}`);

    engineRef.current.postMessage(`position fen ${targetFen}`);
    console.log("ENGINE COMMAND: position");
    // Use time-based search for consistent responsiveness (~1s)
    engineRef.current.postMessage(`go movetime 1000`);
    console.log("ENGINE COMMAND: go movetime 1000");

    return true;
  }, [engineReady, humanizeMoves, showMove, showTopMoves, updateEvalData]);

  const handleEngineMessage = useCallback((line, workerInstance) => {
    if (!line) return;

    console.log("ENGINE:", line);

    if (line === 'uciok') {
      workerInstance.postMessage(`setoption name Hash value 256`);
      workerInstance.postMessage(`setoption name Threads value 4`);
      workerInstance.postMessage('setoption name UCI_ShowWDL value true');
      // Set initial MultiPV based on current settings
      workerInstance.postMessage(`setoption name MultiPV value ${showTopMoves ? 5 : 1}`);
      workerInstance.postMessage('isready');
      return;
    }

    if (line === 'readyok') {
      console.log("ENGINE READY RECEIVED");
      setEngineReady(true);
      workerInstance.postMessage('ucinewgame');
      return;
    }

    if (line.startsWith('info ')) {
      if (!calculatingRef.current) return;

      const { fen: analysisFen, started } = analysisContextRef.current;
      if (!started) return;
      const multiPv = Number.parseInt(line.match(/\bmultipv\s+(\d+)/)?.[1] ?? '1', 10);
      const hint = parseEngineHint(line, analysisFen);
      if (hint) {
        engineLineCacheRef.current.set(hint.rank, hint);

        // Update arrows live as engine finds more lines
        if (showTopMoves) {
          const cachedHints = Array.from(engineLineCacheRef.current.values())
            .sort((left, right) => left.rank - right.rank)
            .slice(0, 5);
          const sanitizedHints = sanitizeEngineHints(cachedHints);
          startTransition(() => {
            setEngineHints(sanitizedHints);
          });
        }
      }

      if ((Number.isFinite(multiPv) ? multiPv : 1) !== 1) return;

      const depthMatch = line.match(/\bdepth\s+(\d+)/);
      const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
      const nextEval = {};

      if (depthMatch) nextEval.depth = depthMatch[1];
      if (scoreMatch) nextEval.score = formatEngineScore(scoreMatch[1], scoreMatch[2]);
      if (hint?.san) {
        nextEval.bestMove = hint.san;
      }
      if (hint?.pv) {
        nextEval.pv = hint.pv;
      }

      updateEvalData(nextEval);
      return;
    }

    if (line.startsWith('bestmove ')) {
      const bestMove = line.match(/^bestmove\s+(\S+)/)?.[1];
      const { fen: analysisFen, mode, started } = analysisContextRef.current;

      if (!started) return;

      calculatingRef.current = false;
      analysisContextRef.current = { ...analysisContextRef.current, id: 0, started: false };
      setIsCalculating(false);

      if (!bestMove || bestMove === '(none)') return;

      const parsedMove = parseUciMove(bestMove);
      if (!parsedMove) return;

      let analysisGame = null;
      try {
        analysisGame = new Chess(analysisFen);
      } catch {
        analysisGame = null;
      }
      const sanMove = analysisGame ? (coordinateToSAN(analysisGame, bestMove) || bestMove) : bestMove;
      const cachedHints = Array.from(engineLineCacheRef.current.values())
        .sort((left, right) => left.rank - right.rank)
        .slice(0, ENGINE_ARROW_STYLES.length);
      const nextHints = cachedHints.length
        ? cachedHints
        : [{
          rank: 1,
          uci: bestMove,
          from: parsedMove.from,
          to: parsedMove.to,
          san: sanMove,
          score: '0.0',
          pv: '',
        }];

      const sanitizedHints = sanitizeEngineHints(nextHints);

      setEngineHints(sanitizedHints);
      updateEvalData({ bestMove: sanitizedHints[0]?.san || sanMove });

      if (mode === 'show') return;

      const selectedCandidate = humanizeMovesRef.current
        ? chooseHumanizedMove(sanitizedHints, humanizeEloRef.current)
        : sanitizedHints[0];

      if (analysisFen === latestFenRef.current && selectedCandidate?.uci) {
        engineMoveApplierRef.current(selectedCandidate.uci);
      }
    }
  }, [parseEngineHint, updateEvalData]);

  const handleEngineMessageRef = useRef(handleEngineMessage);
  useEffect(() => {
    handleEngineMessageRef.current = handleEngineMessage;
  }, [handleEngineMessage]);

  useEffect(() => {
    if (engineRef.current) return;

    console.log("ENGINE WORKER CREATED");
    // Use the single-threaded lite WASM build for maximum compatibility and speed
    const engine = new Worker("/stockfish/stockfish-17.1-lite-single-03e3232.js");

    engine.onmessage = (event) => {
      handleEngineMessageRef.current(event.data, engine);
    };

    engine.onerror = (error) => {
      console.error("ENGINE WORKER ERROR:", error);
      setEngineError("Stockfish worker error occurred.");
    };

    engineRef.current = engine;
    // Small delay to ensure worker is ready
    setTimeout(() => {
      console.log("SENDING UCI COMMAND");
      engine.postMessage('uci');
    }, 200);
  }, []); // Remove dependency to avoid re-runs

  useEffect(() => {
    if (!autoAnalyze || !engineReady) {
      return undefined;
    }

    if (suppressAutoAnalyzeRef.current) {
      suppressAutoAnalyzeRef.current = false;
      return undefined;
    }

    // Stop previous analysis immediately when FEN changes
    if (engineRef.current) {
      engineRef.current.postMessage('stop');
    }

    const timeoutId = window.setTimeout(() => {
      startEngineAnalysis(fen);
    }, 100); // Ultra-fast feedback

    return () => window.clearTimeout(timeoutId);
  }, [autoAnalyze, engineReady, fen, startEngineAnalysis]);

  const selectSquare = useCallback((square) => {
    let boardState = null;
    try {
      boardState = new Chess(latestFenRef.current);
    } catch {
      const fallbackPiece = positionMapFromFen(latestFenRef.current).get(square);
      if (!fallbackPiece) return false;
      setSelectedSquare(square);
      setLegalMoves([]);
      return true;
    }

    const piece = boardState.get(square);
    if (!piece) return false;

    const selectionGame = new Chess(rebuildFen(latestFenRef.current, { turn: piece.color }));
    const nextLegalMoves = selectionGame.moves({ square, verbose: true });

    setSelectedSquare(square);
    setLegalMoves(nextLegalMoves);
    return true;
  }, []);

  const handleLegalBoardMove = useCallback((from, to, pieceColor, promotion) => {
    let moveGame = null;
    const currentFen = latestFenRef.current;
    const nextTurnIndicator = toggleTurn(sideToMove);

    // Attempt move with current turn
    try {
      moveGame = new Chess(currentFen);
      let moveResult = moveGame.move({ from, to, promotion });

      // If move fails, try forcing the turn to the piece color (Consecutive Moves)
      if (!moveResult) {
        const piece = moveGame.get(from);
        if (piece) {
          moveGame = new Chess(rebuildFen(currentFen, { turn: piece.color }));
          moveResult = moveGame.move({ from, to, promotion });
        }
      }

      // FALLBACK: Illegal moves for experimentation (setting up positions, moving into check, etc.)
      if (!moveResult) {
        const nextPosition = positionMapFromFen(currentFen);
        const piece = nextPosition.get(from);
        if (piece) {
          // Manual piece move
          nextPosition.delete(from);

          // Handle promotion in fallback path
          const pieceToPlace = (piece.type === 'p' && promotion)
            ? { type: promotion.toLowerCase(), color: piece.color }
            : piece;
          nextPosition.set(to, pieceToPlace);

          // Manual Castling Detection (King moves 2 squares)
          if (piece.type === 'k') {
            const fromFile = from.charCodeAt(0);
            const toFile = to.charCodeAt(0);
            if (Math.abs(fromFile - toFile) === 2) {
              const rank = from[1];
              if (toFile > fromFile) { // Kingside
                const rookFrom = `h${rank}`;
                const rookTo = `f${rank}`;
                const rook = nextPosition.get(rookFrom);
                if (rook?.type === 'r' && rook.color === piece.color) {
                  nextPosition.delete(rookFrom);
                  nextPosition.set(rookTo, rook);
                }
              } else { // Queenside
                const rookFrom = `a${rank}`;
                const rookTo = `d${rank}`;
                const rook = nextPosition.get(rookFrom);
                if (rook?.type === 'r' && rook.color === piece.color) {
                  nextPosition.delete(rookFrom);
                  nextPosition.set(rookTo, rook);
                }
              }
            }
          }

          // Manual En Passant Detection
          if (piece.type === 'p') {
            const fromFile = from.charCodeAt(0);
            const toFile = to.charCodeAt(0);
            if (fromFile !== toFile && !nextPosition.has(to)) {
              // Pawn moved diagonally to empty square -> likely EP capture
              const capturedPawnSquare = `${to[0]}${from[1]}`;
              nextPosition.delete(capturedPawnSquare);
            }
          }

          const nextFen = rebuildFen(currentFen, {
            board: boardStringFromPositionMap(nextPosition),
            turn: nextTurnIndicator // Toggle the selector
          });

          setFen(nextFen);
          startTransition(() => {
            prepareBoardMutation();
            commitPosition(nextFen, {
              resetMoves: true,
              lastMoveOverride: { from, to },
              turnOverride: nextTurnIndicator
            });
          });
          return true;
        }
        return false;
      }

      // Handle successful chess.js move (includes castling/en passant)
      const nextFen = rebuildFen(moveGame.fen(), {
        turn: nextTurnIndicator // Ensure indicator toggles
      });
      setFen(nextFen);

      startTransition(() => {
        prepareBoardMutation();
        commitPosition(nextFen, {
          moveResult,
          resetMoves: false,
          turnOverride: nextTurnIndicator
        });
      });

      return true;
    } catch (e) {
      console.error("Move processing error:", e);
      return false;
    }
  }, [commitPosition, prepareBoardMutation, sideToMove]);

  const applyFreePlacement = useCallback((sourceSquare, targetSquare, nextPiece) => {
    const nextPosition = positionMapFromFen(latestFenRef.current);

    if (sourceSquare) nextPosition.delete(sourceSquare);

    if (targetSquare && nextPiece) {
      if (nextPiece.type === 'k') {
        for (const square of BOARD_SQUARES) {
          if (square === sourceSquare) continue;
          const existing = nextPosition.get(square);
          if (existing?.type === 'k' && existing.color === nextPiece.color) {
            nextPosition.delete(square);
            break;
          }
        }
      }

      // Official Castling Detection in Free Placement (Setup Mode)
      if (nextPiece.type === 'k' && sourceSquare) {
        const fromFile = sourceSquare.charCodeAt(0);
        const toFile = targetSquare.charCodeAt(0);
        const rank = sourceSquare[1];
        const color = nextPiece.color;

        // Ensure current turn matches piece color for automatic castling logic
        // or prioritize this as a "setup" shortcut.
        const standardKingPos = color === 'w' ? 'e1' : 'e8';
        if (sourceSquare === standardKingPos) {
          if (toFile - fromFile === 2) { // Kingside (e -> g)
            const fSq = `f${rank}`;
            const hSq = `h${rank}`;
            // Squares between King start and Rook start must be empty
            if (!nextPosition.get(fSq)) {
              const rook = nextPosition.get(hSq);
              if (rook?.type === 'r' && rook.color === color) {
                nextPosition.delete(hSq);
                nextPosition.set(fSq, rook);
              }
            }
          } else if (fromFile - toFile === 2) { // Queenside (e -> c)
            const dSq = `d${rank}`;
            const bSq = `b${rank}`;
            const aSq = `a${rank}`;
            // Squares between King start and Rook start must be empty
            if (!nextPosition.get(dSq) && !nextPosition.get(bSq)) {
              const rook = nextPosition.get(aSq);
              if (rook?.type === 'r' && rook.color === color) {
                nextPosition.delete(aSq);
                nextPosition.set(dSq, rook);
              }
            }
          }
        }
      }

      nextPosition.delete(targetSquare);
      nextPosition.set(targetSquare, nextPiece);
    }

    // Toggle the move selector after piece movement
    const nextTurn = toggleTurn(sideToMove);

    const nextFen = rebuildFen(latestFenRef.current, {
      board: boardStringFromPositionMap(nextPosition),
      turn: nextTurn,
      castlingState: castling,
    });

    // Update the FEN state immediately for an instant UI update
    setFen(nextFen);

    startTransition(() => {
      prepareBoardMutation();
      commitPosition(nextFen, {
        resetMoves: true,
        turnOverride: nextTurn,
        castlingOverride: castling,
        lastMoveOverride: sourceSquare ? { from: sourceSquare, to: targetSquare } : null,
      });
    });
    return true;
  }, [castling, commitPosition, prepareBoardMutation, sideToMove]);

  const onSquareClick = useCallback(({ square }) => {
    if (!isBoardSquare(square)) return;

    if (!selectedSquare) {
      selectSquare(square);
      return;
    }

    if (square === selectedSquare) {
      clearSelection();
      return;
    }

    const candidates = legalTargetsBySquare.get(square);
    if (candidates?.length) {
      const chosenMove = candidates.find(move => move.promotion === 'q') ?? candidates[0];
      const movingPiece = gameRef.current?.get?.(chosenMove.from);
      if (!movingPiece) {
        clearSelection();
        return;
      }

      handleLegalBoardMove(
        chosenMove.from,
        chosenMove.to,
        movingPiece.color,
        chosenMove.promotion || (movingPiece.type === 'p' && /[18]$/.test(chosenMove.to) ? 'q' : undefined)
      );
      return;
    }

    if (!selectSquare(square)) {
      clearSelection();
    }
  }, [clearSelection, handleLegalBoardMove, legalTargetsBySquare, selectSquare, selectedSquare]);

  const onPieceDrop = useCallback(({ piece, sourceSquare, targetSquare }) => {
    if (!targetSquare) {
      if (sourceSquare) {
        return applyFreePlacement(sourceSquare, null, null);
      }
      return false;
    }
    if (sourceSquare && sourceSquare === targetSquare) return false;

    // Handle pieces dragged from the side tray (spare pieces)
    if (piece?.isSparePiece) {
      const pieceType = piece.pieceType;
      return applyFreePlacement(null, targetSquare, {
        color: pieceType[0],
        type: pieceType[1].toLowerCase(),
      });
    }

    // FAST PATH: Attempt a legal move first using the chess.js engine.
    // This provides the smoothest interaction for standard play.
    const movingPieceColor = piece[0]; // 'w' or 'b' from 'wP', 'bK', etc.
    const success = handleLegalBoardMove(sourceSquare, targetSquare, movingPieceColor);
    if (success) return true;

    // SLOW PATH: Fallback to free placement (e.g. board editor style dragging).
    // If the engine is calculating, do not allow free placement. 
    // Return false so react-chessboard natively queues this attempt as a premove!
    if (isCalculating) return false;

    const movingPiece = positionMapFromFen(latestFenRef.current).get(sourceSquare);
    if (!movingPiece) return false;

    return applyFreePlacement(sourceSquare, targetSquare, {
      type: movingPiece.type,
      color: movingPiece.color,
    });
  }, [applyFreePlacement, handleLegalBoardMove, isCalculating]);

  const squareRenderer = useCallback(({ square, children }) => {
    const isSelected = square === selectedSquare;
    const isLegal = legalTargetsBySquare.has(square);
    const isCapture = captureTargets.has(square);
    const isLastFrom = lastMove?.from === square;
    const isLastTo = lastMove?.to === square;
    const isCheck = checkSquare === square;
    const isCheckAttacker = checkAttackers.has(square);
    const badge = kingBadges.get(square);

    return (
      <div className={`premium-square${isSelected ? ' is-selected' : ''}`}>
        {isLastFrom ? <div className="premium-last-move from" /> : null}
        {isLastTo ? <div className="premium-last-move to" /> : null}
        {isCheck ? <div className="premium-check-glow" /> : null}
        {isCheckAttacker ? <div className="premium-check-attacker" /> : null}
        {showLegalDots && isLegal ? (
          isCapture ? <div className="premium-capture-ring" /> : <div className="premium-move-dot" />
        ) : null}
        {badge ? <div className={`premium-king-badge ${badge.variant}`}>{badge.icon}</div> : null}
        <div className="premium-square-content">{children}</div>
      </div>
    );
  }, [captureTargets, checkAttackers, checkSquare, kingBadges, lastMove, legalTargetsBySquare, selectedSquare, showLegalDots]);

  const updatePosition = useCallback((nextFen, { resetMoves = true } = {}) => {
    try {
      const parsedGame = new Chess(nextFen);
      prepareBoardMutation();
      commitPosition(parsedGame.fen(), { resetMoves });
    } catch (error) {
      console.error('Invalid FEN:', error);
      setFenError('Invalid FEN');
    }
  }, [commitPosition, prepareBoardMutation]);

  const handleSideChange = useCallback((turn) => {
    try {
      prepareBoardMutation();
      const nextFen = rebuildFen(latestFenRef.current, {
        turn,
        castlingState: castling,
      });
      commitPosition(nextFen, {
        resetMoves: true,
        turnOverride: turn,
        castlingOverride: castling,
      });
    } catch (error) {
      console.error('Failed to update side to move:', error);
      setFenError('Invalid turn configuration');
    }
  }, [castling, commitPosition, prepareBoardMutation]);

  const handleCastlingChange = useCallback((key) => {
    try {
      prepareBoardMutation();
      const nextCastling = { ...castling, [key]: !castling[key] };
      const nextFen = rebuildFen(latestFenRef.current, {
        turn: sideToMove,
        castlingState: nextCastling,
      });
      commitPosition(nextFen, {
        resetMoves: true,
        turnOverride: sideToMove,
        castlingOverride: nextCastling,
      });
    } catch (error) {
      console.error('Failed to update castling rights:', error);
      setFenError('Invalid castling configuration');
    }
  }, [castling, commitPosition, prepareBoardMutation, sideToMove]);

  const handleCalculate = useCallback(() => {
    startEngineAnalysis(fen);
  }, [fen, startEngineAnalysis]);

  const handleStop = useCallback(() => {
    stopEngine(false);
  }, [stopEngine]);

  const clearBoard = useCallback(() => {
    prepareBoardMutation();
    commitPosition(rebuildFen(latestFenRef.current, {
      board: '8/8/8/8/8/8/8/8',
      turn: sideToMove,
      castlingState: castling,
      enPassant: '-',
      halfMove: '0',
      fullMove: '1',
    }), {
      resetMoves: true,
      turnOverride: sideToMove,
      castlingOverride: castling,
      lastMoveOverride: null,
      resultOverride: null,
    });
  }, [castling, commitPosition, prepareBoardMutation, sideToMove]);

  const startPos = useCallback(() => {
    updatePosition(DEFAULT_FEN);
  }, [updatePosition]);

  const handleRematch = useCallback(() => {
    updatePosition(DEFAULT_FEN);
  }, [updatePosition]);

  const handleNewGame = useCallback(() => {
    setOrientation('white');
    updatePosition(DEFAULT_FEN);
  }, [updatePosition]);

  const handleAnalysisFromModal = useCallback(() => {
    setIsResultModalOpen(false);
    handleCalculate();
  }, [handleCalculate]);

  return (
    <div className="analysis-redesign-container">
      <div className="analysis-grid">
          <section className="board-column">
            <div className="analysis-board-stage">
              <ChessBoard
                fen={fen}
                mode="analysis"
                onMove={onPieceDrop}
                isLocked={false}
                orientation={orientation}
                onSquareClick={onSquareClick}
                squareRenderer={squareRenderer}
                arrows={engineArrows}
                allowDragOffBoard
                allowDrawingArrows={false}
                animationDurationInMs={0}
                showNotation
                arePremovesAllowed
                clearPremovesOnRightClick
                boardId="analysisBoard"
                onBoardSizeChange={setBoardPx}
                wrapBoard={(boardShell) => (
                  <>
                    <div className="analysis-tray-wrap">
                      <ExtraPiecesTrayRow
                        pieceTypes={topTrayPieces}
                        squarePx={squarePx}
                        ariaLabel="Extra pieces (top)"
                      />
                    </div>

                    <div className="analysis-board-eval-row">
                      {boardShell}

                      <div className="analysis-side-rail">
                        {showEvalBar ? (
                          <div className="analysis-eval-shell">
                            <EvalBar percent={evalPercent} scoreText={displayScore} height={boardPx} />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="analysis-tray-wrap analysis-tray-bottom">
                      <ExtraPiecesTrayRow
                        pieceTypes={bottomTrayPieces}
                        squarePx={squarePx}
                        ariaLabel="Extra pieces (bottom)"
                      />
                    </div>
                  </>
                )}
              >
                {engineArrowCallouts.length ? (
                  <svg
                    className="analysis-arrow-label-layer"
                    viewBox={`0 0 ${boardPx} ${boardPx}`}
                    aria-hidden="true"
                  >
                    {engineArrowCallouts.map((callout) => (
                      <g
                        key={callout.id}
                        transform={`translate(${callout.x} ${callout.y})`}
                      >
                        <rect
                          x="-11"
                          y="-9"
                          width="22"
                          height="18"
                          rx="6"
                          fill={callout.color}
                          opacity="0.96"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#f7f7f7"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {callout.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                ) : null}
                <button
                  className="analysis-settings-button"
                  type="button"
                  aria-label="Open analysis settings"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <span aria-hidden="true">⚙</span>
                </button>
              </ChessBoard>
            </div>

            <div className="analysis-board-summary">
              <span className="analysis-board-chip">
                Turn <strong>{colorName(sideToMove)}</strong>
              </span>
              <span className="analysis-board-chip">
                Engine <strong>{engineProfile?.label ?? 'Loading...'}</strong>
              </span>
              <span className="analysis-board-chip">
                Status <strong>{gameStatusText}</strong>
              </span>
            </div>
          </section>

          <section className="controls-column">
            <div className="analysis-top-actions">
              <button className="ctrl-btn" onClick={startPos} type="button">Start Pos</button>
              <button className="ctrl-btn" onClick={() => updatePosition(fenInput)} type="button">Set FEN</button>
              <button className="ctrl-btn" onClick={clearBoard} type="button">Clear</button>
              <button
                className="ctrl-btn"
                onClick={() => setOrientation(current => current === 'white' ? 'black' : 'white')}
                type="button"
              >
                Flip
              </button>
              <button
                className="btn-chess-bot-x"
                onClick={isCalculating ? handleStop : handleCalculate}
                disabled={!engineReady && !isCalculating}
                type="button"
              >
                {isCalculating ? 'Stop Bot' : 'ChessBotX'}
              </button>
            </div>

            <div className="analysis-fen-row">
              <label htmlFor="analysis-fen" className="analysis-inline-label">FEN:</label>
              <div className="fen-field">
                <input
                  id="analysis-fen"
                  className="fen-input"
                  type="text"
                  value={fenInput}
                  onChange={(event) => setFenInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') updatePosition(fenInput);
                  }}
                />
                {fenError ? <div className="fen-error">{fenError}</div> : null}
              </div>
            </div>

            <div className="side-castling-row">
              <div className="control-panel side-panel">
                <label className="radio-label">
                  <input type="radio" checked={sideToMove === 'w'} onChange={() => handleSideChange('w')} />
                  <span className="radio-custom blue" />
                  White to move
                </label>
                <label className="radio-label">
                  <input type="radio" checked={sideToMove === 'b'} onChange={() => handleSideChange('b')} />
                  <span className="radio-custom blue" />
                  Black to move
                </label>
              </div>

              <div className="control-panel castling-panel">
                <label className="check-label">
                  <input type="checkbox" checked={castling.wK} onChange={() => handleCastlingChange('wK')} />
                  <span className="check-custom" />
                  White O-O
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={castling.wQ} onChange={() => handleCastlingChange('wQ')} />
                  <span className="check-custom" />
                  White O-O-O
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={castling.bK} onChange={() => handleCastlingChange('bK')} />
                  <span className="check-custom" />
                  Black O-O
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={castling.bQ} onChange={() => handleCastlingChange('bQ')} />
                  <span className="check-custom" />
                  Black O-O-O
                </label>
              </div>
            </div>

            {engineError ? <div className="analysis-warning">{engineError}</div> : null}

            <div className="calc-move-row">
              <button
                className="calculate-btn"
                onClick={handleCalculate}
                disabled={isCalculating || !engineReady}
                type="button"
              >
                {!engineReady ? 'Engine loading...' : (isCalculating ? 'Calculating...' : 'Calculate position')}
              </button>

              <div className="control-panel move-toggles" role="group" aria-label="Engine move mode">
                <label className="radio-label">
                  <input type="radio" checked={showMove} onChange={() => setShowMove(true)} />
                  <span className="radio-custom blue" />
                  Show move
                </label>
                <label className="radio-label">
                  <input type="radio" checked={!showMove} onChange={() => setShowMove(false)} />
                  <span className="radio-custom white-outline" />
                  Make move
                </label>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Best Move:</span>
                <div className="stat-box">{evalData.bestMove || '--'}</div>
              </div>
              <div className="stat-item">
                <span className="stat-label">Score:</span>
                <div className="stat-box">{displayScore}</div>
              </div>
              <div className="stat-item">
                <span className="stat-label">Depth:</span>
                <div className="stat-box">{evalData.depth}</div>
              </div>
            </div>

            <div className="control-group pv-row">
              <label>PV:</label>
              <div className="pv-display">{deferredPv || (isCalculating ? 'Analyzing...' : '--')}</div>
            </div>

          </section>
        </div>

      {isSettingsModalOpen ? (
        <AnalysisSettingsModal
          open={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          autoAnalyze={autoAnalyze}
          onAutoAnalyzeChange={setAutoAnalyze}
          showBestMoveArrow={showBestMoveArrow}
          onShowBestMoveArrowChange={setShowBestMoveArrow}
          showTopMoves={showTopMoves}
          onShowTopMovesChange={setShowTopMoves}
          humanizeMoves={humanizeMoves}
          onHumanizeMovesChange={setHumanizeMoves}
          humanizeElo={humanizeElo}
          onHumanizeEloChange={(value) => setHumanizeElo(clampHumanizeElo(value))}
          thinkingTime={thinkingTime}
          onThinkingTimeChange={(value) => setThinkingTime(clampThinkingTime(value))}
        />
      ) : null}

      <GameResultModal
        open={isResultModalOpen}
        result={gameResult}
        onRematch={handleRematch}
        onNewGame={handleNewGame}
        onAnalysis={handleAnalysisFromModal}
        onClose={() => setIsResultModalOpen(false)}
      />
    </div>
  );
}
