import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Chess } from 'chess.js';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiChip,
  HiRefresh,
  HiSelector,
  HiSwitchHorizontal,
  HiUser,
  HiUserGroup,
  HiX,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext.jsx';
import EvalBar from './EvalBar.jsx';
import GameResultModal from './GameResultModal.jsx';
import { coordinateToSAN } from '../utils/moveNotation.js';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';
import useChessSounds from '../hooks/useChessSounds.js';
import useChessDragClass from '../hooks/useChessDragClass.js';
import useMoveAnalyzer from '../hooks/useMoveAnalyzer.js';
import {
  BrokenCrownIcon,
  CrownIcon,
  DrawEmblemIcon,
  HourglassIcon,
  WhiteFlagIcon,
} from './PremiumResultIcons.jsx';
import {
  DEFAULT_FEN,
  colorName,
  computeGameResult,
  findAttackersOfSquare,
  findKingSquare,
  formatEngineScore,
  isBoardSquare,
  isDrawReason,
  parseUciMove,
} from '../chess/analysisHelpers.js';

const DEFAULT_BOARD_PX = 756;
const TIME_PRESETS = Object.freeze({
  bullet: { label: '1|0 Bullet', baseMs: 60_000, incrementMs: 0 },
  blitz: { label: '3|0 Blitz', baseMs: 180_000, incrementMs: 0 },
  rapid: { label: '10|0 Rapid', baseMs: 600_000, incrementMs: 0 },
});

function toggleTurn(turn) {
  return turn === 'b' ? 'w' : 'b';
}

function scoreToPercent(scoreText) {
  if (/^-M\d+$/i.test(scoreText)) return 0;
  if (/^M\d+$/i.test(scoreText)) return 100;

  const numeric = Number.parseFloat(scoreText);
  if (!Number.isFinite(numeric)) return 50;

  const clamped = Math.max(-10, Math.min(10, numeric));
  return 50 + (clamped / 20) * 100;
}

function formatClock(milliseconds) {
  const totalTenths = Math.max(0, Math.ceil(milliseconds / 100));
  const totalSeconds = Math.floor(totalTenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (milliseconds < 60_000) {
    return `${seconds}.${totalTenths % 10}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getManualResult(type, sideToMove) {
  if (type === 'draw') {
    return {
      reason: 'draw',
      title: 'Draw agreed',
      subtitle: 'The game was ended as a draw.',
    };
  }

  const loser = sideToMove;
  return {
    reason: type,
    winner: toggleTurn(loser),
    loser,
  };
}

function buildTimeConfig(preset, minutes, increment) {
  if (preset !== 'custom') {
    return TIME_PRESETS[preset] ?? TIME_PRESETS.blitz;
  }

  const safeMinutes = Math.max(1, Number(minutes) || 15);
  const safeIncrement = Math.max(0, Number(increment) || 0);

  return {
    label: `${safeMinutes}|${safeIncrement} Custom`,
    baseMs: safeMinutes * 60_000,
    incrementMs: safeIncrement * 1_000,
  };
}

function getParticipant(mode, color, playerColor, difficulty) {
  if (mode === 'engine') {
    if (color === (playerColor === 'black' ? 'b' : 'w')) {
      return {
        icon: <HiUser />,
        label: 'You',
        sublabel: colorName(color),
      };
    }

    return {
      icon: <HiChip />,
      label: `Stockfish Lvl ${difficulty}`,
      sublabel: 'Engine',
    };
  }

  return {
    icon: <HiUserGroup />,
    label: `${colorName(color)} side`,
    sublabel: 'Pass & Play',
  };
}

export default function PlayWorkspace({ mode = 'engine' }) {
  const { boardTheme, pieceStyle, showEvalBar, showLegalDots } = useApp();
  const { analyses, latestAnalysis, isAnalyzing, analyzeMove, resetAnalyses } = useMoveAnalyzer();
  const location = useLocation();
  const navigate = useNavigate();
  const { playMove, playCapture, playCheck, playGameEnd } = useChessSounds();
  const {
    clearPieceDrag,
    draggingPieceGhostStyle,
    draggingPieceStyle,
    handlePieceDragStart,
  } = useChessDragClass();

  const opening = location.state?.opening ?? null;
  const openingPracticeMode = location.state?.practiceMode ?? null;
  const startingFen = opening?.fen ?? DEFAULT_FEN;

  const chessRef = useRef(new Chess(startingFen));
  const boardWrapRef = useRef(null);
  const engineRef = useRef(null);
  const latestFenRef = useRef(startingFen);
  const resultRef = useRef(null);
  const pendingBestMoveRef = useRef(null);
  const timerTickRef = useRef(0);
  const moveIndexRef = useRef(0);

  const [fen, setFen] = useState(() => new Chess(startingFen).fen());
  const [boardPx, setBoardPx] = useState(DEFAULT_BOARD_PX);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [sideToMove, setSideToMove] = useState(() => new Chess(startingFen).turn());
  const [setupOpen, setSetupOpen] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [setupColor, setSetupColor] = useState('white');
  const [setupOrientation, setSetupOrientation] = useState(mode === 'engine' ? 'auto' : 'white');
  const [setupPreset, setSetupPreset] = useState('blitz');
  const [customMinutes, setCustomMinutes] = useState(15);
  const [customIncrement, setCustomIncrement] = useState(10);
  const [difficulty, setDifficulty] = useState(5);
  const [playerColor, setPlayerColor] = useState('white');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [timeConfig, setTimeConfig] = useState(TIME_PRESETS.blitz);
  const [timers, setTimers] = useState({
    w: TIME_PRESETS.blitz.baseMs,
    b: TIME_PRESETS.blitz.baseMs,
  });
  const [engineReady, setEngineReady] = useState(mode === 'human');
  const [engineThinking, setEngineThinking] = useState(false);
  const [engineEval, setEngineEval] = useState({ score: '0.0', bestMove: '--' });
  const [gameResult, setGameResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    latestFenRef.current = fen;
  }, [fen]);

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

  const squarePx = useMemo(() => Math.max(1, boardPx / 8), [boardPx]);
  const customPieces = useMemo(
    () => getPieceRenderers(pieceStyle, squarePx),
    [pieceStyle, squarePx]
  );

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
    return findAttackersOfSquare(boardGame, checkSquare, toggleTurn(boardGame.turn()));
  }, [boardGame, checkSquare]);

  const legalTargetsBySquare = useMemo(() => {
    const bySquare = new Map();
    legalMoves.forEach((move) => {
      const list = bySquare.get(move.to) ?? [];
      list.push(move);
      bySquare.set(move.to, list);
    });
    return bySquare;
  }, [legalMoves]);

  const captureTargets = useMemo(() => {
    const targets = new Set();
    legalMoves.forEach((move) => {
      if (move.captured) targets.add(move.to);
    });
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

  const playerColorCode = playerColor === 'black' ? 'b' : 'w';
  const canInteract = gameStarted && !gameResult && (mode === 'human' || sideToMove === playerColorCode);
  const topColor = boardOrientation === 'white' ? 'b' : 'w';
  const bottomColor = toggleTurn(topColor);
  const topParticipant = getParticipant(mode, topColor, playerColor, difficulty);
  const bottomParticipant = getParticipant(mode, bottomColor, playerColor, difficulty);
  const evalPercent = useMemo(() => scoreToPercent(engineEval.score), [engineEval.score]);

  const gameStatusText = useMemo(() => {
    if (gameResult) return gameResult.title || gameResult.reason;
    if (!gameStarted) return 'Setup';
    if (mode === 'engine') {
      if (!engineReady) return 'Loading engine';
      if (engineThinking) return 'Engine thinking';
    }
    return 'Live';
  }, [engineReady, engineThinking, gameResult, gameStarted, mode]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const finishGame = useCallback((result) => {
    if (resultRef.current) return;

    resultRef.current = result;
    setEngineThinking(false);
    setGameResult(result);
    setIsResultModalOpen(true);
    playGameEnd();
  }, [playGameEnd]);

  const resetBoardState = useCallback((nextFen, nextTimers, nextOrientation, nextPlayerColor) => {
    const nextGame = new Chess(nextFen);
    chessRef.current = nextGame;
    latestFenRef.current = nextGame.fen();
    resultRef.current = null;
    pendingBestMoveRef.current = null;
    moveIndexRef.current = 0;
    resetAnalyses();

    setFen(nextGame.fen());
    setSideToMove(nextGame.turn());
    setMoveHistory([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameResult(null);
    setIsResultModalOpen(false);
    setEngineThinking(false);
    setEngineEval({ score: '0.0', bestMove: '--' });
    setTimers(nextTimers);

    if (nextOrientation) setBoardOrientation(nextOrientation);
    if (nextPlayerColor) setPlayerColor(nextPlayerColor);
  }, [resetAnalyses]);

  const startConfiguredGame = useCallback((options = {}) => {
    const resolvedColor = mode === 'engine'
      ? (setupColor === 'random'
        ? (Math.random() < 0.5 ? 'white' : 'black')
        : setupColor)
      : playerColor;
    const resolvedOrientation = options.orientation
      ?? (setupOrientation === 'auto' ? resolvedColor : setupOrientation);
    const resolvedTime = options.timeConfig ?? buildTimeConfig(setupPreset, customMinutes, customIncrement);

    setTimeConfig(resolvedTime);
    setSetupOpen(false);
    setGameStarted(true);

    resetBoardState(
      startingFen,
      { w: resolvedTime.baseMs, b: resolvedTime.baseMs },
      resolvedOrientation,
      resolvedColor
    );

    engineRef.current?.postMessage?.('ucinewgame');
  }, [
    customIncrement,
    customMinutes,
    mode,
    playerColor,
    resetBoardState,
    setupColor,
    setupOrientation,
    setupPreset,
    startingFen,
  ]);

  const reopenSetup = useCallback(() => {
    const previewGame = new Chess(startingFen);
    chessRef.current = previewGame;
    latestFenRef.current = previewGame.fen();
    resultRef.current = null;
    pendingBestMoveRef.current = null;
    moveIndexRef.current = 0;
    resetAnalyses();

    setGameStarted(false);
    setSetupOpen(true);
    setFen(previewGame.fen());
    setSideToMove(previewGame.turn());
    setMoveHistory([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameResult(null);
    setIsResultModalOpen(false);
    setEngineThinking(false);
    setEngineEval({ score: '0.0', bestMove: '--' });
  }, [resetAnalyses, startingFen]);

  const closeSetup = useCallback(() => {
    navigate('/play');
  }, [navigate]);

  const syncMoveIntoState = useCallback((nextGame, moveResult) => {
    const prevFen = chessRef.current.fen();
    const moveIdx = moveIndexRef.current;
    moveIndexRef.current += 1;

    latestFenRef.current = nextGame.fen();
    chessRef.current = nextGame;

    analyzeMove(moveIdx, moveResult.san, prevFen);

    clearSelection();
    setFen(nextGame.fen());
    setSideToMove(nextGame.turn());
    setLastMove({ from: moveResult.from, to: moveResult.to });

    if (timeConfig.incrementMs > 0) {
      setTimers((previous) => ({
        ...previous,
        [moveResult.color]: previous[moveResult.color] + timeConfig.incrementMs,
      }));
    }

    startTransition(() => {
      setMoveHistory((previous) => [
        ...previous,
        {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          color: moveResult.color,
          promotion: moveResult.promotion,
          fen: nextGame.fen(),
        },
      ]);
    });

    if (moveResult.captured) {
      playCapture();
    } else {
      playMove();
    }

    if (nextGame.isCheck()) {
      playCheck();
    }

    const result = computeGameResult(nextGame);
    if (result) {
      finishGame(result);
    }
  }, [analyzeMove, clearSelection, finishGame, playCapture, playCheck, playMove, timeConfig.incrementMs]);

  const applyUciMove = useCallback((uciMove) => {
    const parsed = parseUciMove(uciMove);
    if (!parsed || resultRef.current) return;

    const nextGame = new Chess(latestFenRef.current);
    const moveResult = nextGame.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion || 'q',
    });

    if (!moveResult) return;
    syncMoveIntoState(nextGame, moveResult);
  }, [syncMoveIntoState]);

  useEffect(() => {
    if (mode !== 'engine') return undefined;

    const engine = new Worker('/stockfish/stockfish-18-lite-single.js');
    engineRef.current = engine;

    const handleMessage = (event) => {
      const line = String(event?.data ?? '').trim();
      if (!line) return;

      if (line === 'uciok') {
        engine.postMessage('setoption name Threads value 2');
        engine.postMessage('setoption name Hash value 64');
        engine.postMessage('isready');
        return;
      }

      if (line === 'readyok') {
        setEngineReady(true);
        return;
      }

      if (line.startsWith('info ')) {
        const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
        const pvCoordinates = line.match(/\bpv\s+(.+)$/)?.[1]?.trim() || '';
        if (!scoreMatch) return;

        const bestMove = pvCoordinates.split(' ')[0];
        let bestSan = '--';
        if (bestMove) {
          try {
            bestSan = coordinateToSAN(new Chess(latestFenRef.current), bestMove) || bestMove;
          } catch {
            bestSan = bestMove;
          }
        }

        setEngineEval({
          score: formatEngineScore(scoreMatch[1], scoreMatch[2]),
          bestMove: bestSan,
        });
        return;
      }

      if (line.startsWith('bestmove ')) {
        const bestMove = line.match(/^bestmove\s+(\S+)/)?.[1];
        setEngineThinking(false);

        if (bestMove && bestMove !== '(none)' && pendingBestMoveRef.current) {
          pendingBestMoveRef.current(bestMove);
          pendingBestMoveRef.current = null;
        }
      }
    };

    const handleError = () => {
      setEngineThinking(false);
    };

    engine.addEventListener('message', handleMessage);
    engine.addEventListener('error', handleError);
    engine.postMessage('uci');

    return () => {
      pendingBestMoveRef.current = null;
      engine.removeEventListener('message', handleMessage);
      engine.removeEventListener('error', handleError);
      engine.terminate();
      engineRef.current = null;
    };
  }, [mode]);

  const requestEngineMove = useCallback(() => {
    if (mode !== 'engine' || !engineReady || !gameStarted || engineThinking || resultRef.current) return;

    pendingBestMoveRef.current = applyUciMove;
    setEngineThinking(true);
    setEngineEval({ score: '0.0', bestMove: '--' });

    const depth = Math.max(4, difficulty + 4);
    const skill = Math.round(((difficulty - 1) / 9) * 20);

    engineRef.current?.postMessage?.('stop');
    engineRef.current?.postMessage?.(`setoption name Skill Level value ${skill}`);
    engineRef.current?.postMessage?.(`position fen ${latestFenRef.current}`);
    engineRef.current?.postMessage?.(`go depth ${depth}`);
  }, [applyUciMove, difficulty, engineReady, engineThinking, gameStarted, mode]);

  useEffect(() => {
    if (mode !== 'engine' || !gameStarted || gameResult || !engineReady) return undefined;
    if (sideToMove === playerColorCode) return undefined;

    const timer = window.setTimeout(() => {
      requestEngineMove();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [engineReady, gameResult, gameStarted, mode, playerColorCode, requestEngineMove, sideToMove]);

  useEffect(() => {
    if (!gameStarted || gameResult) return undefined;

    timerTickRef.current = Date.now();

    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - timerTickRef.current;
      timerTickRef.current = now;

      setTimers((previous) => {
        const nextValue = Math.max(0, previous[sideToMove] - elapsed);
        if (nextValue === 0 && previous[sideToMove] > 0) {
          window.setTimeout(() => {
            finishGame({
              reason: 'timeout',
              winner: toggleTurn(sideToMove),
              loser: sideToMove,
            });
          }, 0);
        }

        return {
          ...previous,
          [sideToMove]: nextValue,
        };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [finishGame, gameResult, gameStarted, sideToMove]);

  const selectSquare = useCallback((square) => {
    if (!canInteract || !isBoardSquare(square)) return false;

    const piece = chessRef.current.get(square);
    if (!piece) return false;
    if (piece.color !== sideToMove) return false;
    if (mode === 'engine' && piece.color !== playerColorCode) return false;

    const nextMoves = chessRef.current.moves({ square, verbose: true });
    if (!nextMoves.length) return false;

    setSelectedSquare(square);
    setLegalMoves(nextMoves);
    return true;
  }, [canInteract, mode, playerColorCode, sideToMove]);

  const tryMove = useCallback((sourceSquare, targetSquare) => {
    if (!gameStarted || gameResult || !sourceSquare || !targetSquare) return false;
    if (mode === 'engine' && sideToMove !== playerColorCode) return false;

    const nextGame = new Chess(latestFenRef.current);
    const moveResult = nextGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (!moveResult) return false;
    syncMoveIntoState(nextGame, moveResult);
    return true;
  }, [gameResult, gameStarted, mode, playerColorCode, sideToMove, syncMoveIntoState]);

  const onSquareClick = useCallback(({ square }) => {
    if (!selectedSquare) {
      selectSquare(square);
      return;
    }

    if (selectedSquare === square) {
      clearSelection();
      return;
    }

    const candidates = legalTargetsBySquare.get(square);
    if (candidates?.length) {
      const chosenMove = candidates.find((move) => move.promotion === 'q') ?? candidates[0];
      tryMove(chosenMove.from, chosenMove.to);
      return;
    }

    if (!selectSquare(square)) {
      clearSelection();
    }
  }, [clearSelection, legalTargetsBySquare, selectSquare, selectedSquare, tryMove]);

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (!targetSquare || sourceSquare === targetSquare) {
      clearPieceDrag();
      return false;
    }

    const didMove = tryMove(sourceSquare, targetSquare);
    clearPieceDrag();
    return didMove;
  }, [clearPieceDrag, tryMove]);

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

  const reviewPayload = useMemo(() => ({
    reviewData: {
      initialFen: startingFen,
      moves: moveHistory,
      source: mode,
      opening,
      playerColor: mode === 'engine' ? playerColorCode : null,
      title: mode === 'engine' ? `vs Stockfish Lvl ${difficulty}` : 'Pass & Play',
    },
  }), [difficulty, mode, moveHistory, opening, playerColorCode, startingFen]);

  const boardOptions = useMemo(() => {
    const options = {
      id: mode === 'engine' ? 'play-computer-board' : 'play-human-board',
      position: fen,
      onPieceDrop,
      onSquareClick,
      boardOrientation,
      lightSquareStyle: { backgroundColor: boardTheme.light },
      darkSquareStyle: { backgroundColor: boardTheme.dark },
      animationDurationInMs: 120,
      allowDragOffBoard: false,
      allowDrawingArrows: false,
      arePremovesAllowed: true,
      clearPremovesOnRightClick: true,
      squareRenderer,
      showNotation: true,
      onPieceDrag: handlePieceDragStart,
      draggingPieceStyle,
      draggingPieceGhostStyle,
    };

    if (customPieces) {
      options.pieces = customPieces;
    }

    return options;
  }, [
    boardOrientation,
    boardTheme.dark,
    boardTheme.light,
    draggingPieceGhostStyle,
    draggingPieceStyle,
    customPieces,
    fen,
    handlePieceDragStart,
    mode,
    onPieceDrop,
    onSquareClick,
    squareRenderer,
  ]);

  return (
    <div className="analysis-redesign-container play-workspace-shell">
      <ChessboardProvider options={boardOptions}>
        <div className="analysis-grid">
          <section className="board-column">
            <div className="analysis-board-stage">
              <div className="analysis-board-eval-row">
                <div ref={boardWrapRef} className="chessboard-container premium-board-shell">
                  <Chessboard />
                </div>
                <div className="analysis-side-rail">
                  {showEvalBar ? (
                    <div className="analysis-eval-shell">
                      <EvalBar percent={evalPercent} scoreText={engineEval.score} height={boardPx} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="analysis-board-summary">
              <span className="analysis-board-chip">Turn <strong>{colorName(sideToMove)}</strong></span>
              <span className="analysis-board-chip">Status <strong>{gameStatusText}</strong></span>
              <span className="analysis-board-chip">Clock <strong>{timeConfig.label}</strong></span>
              {opening ? <span className="analysis-board-chip">Opening <strong>{opening.name}</strong></span> : null}
              {mode === 'engine' ? <span className="analysis-board-chip">Engine <strong>Lvl {difficulty}</strong></span> : null}
              {openingPracticeMode ? (
                <span className="analysis-board-chip">Mode <strong>{openingPracticeMode === 'engine' ? 'Engine practice' : 'Trainer launch'}</strong></span>
              ) : null}
            </div>
          </section>

          <section className="controls-column">
            <div className="play-live-panel">
              <div className={`play-clock-card${sideToMove === topColor && gameStarted && !gameResult ? ' is-active' : ''}`}>
                <div className="play-clock-copy">
                  <span className="play-clock-icon">{topParticipant.icon}</span>
                  <div>
                    <strong>{topParticipant.label}</strong>
                    <span>{topParticipant.sublabel}</span>
                  </div>
                </div>
                <div className="play-clock-time">{formatClock(timers[topColor])}</div>
              </div>

              <div className="move-list-panel play-live-moves">
                <div className="move-list-header">Moves</div>
                <div className="move-list-body">
                  {!moveHistory.length ? (
                    <p className="play-live-empty">The board is ready whenever you are.</p>
                  ) : (
                    moveHistory.reduce((rows, move, index) => {
                      if (index % 2 === 0) rows.push([move, moveHistory[index + 1]]);
                      return rows;
                    }, []).map((pair, index) => {
                      const whiteAnalysis = analyses[index * 2];
                      const blackAnalysis = analyses[index * 2 + 1];
                      return (
                        <div key={`${pair[0]?.san}-${index}`} className="move-pair">
                          <span className="move-num">{index + 1}.</span>
                          <span className={`move-san white${moveHistory.length - 1 === index * 2 ? ' current' : ''}`}>
                            {pair[0]?.san ?? '--'}
                            {whiteAnalysis && (
                              <span
                                className="move-analysis-badge-icon"
                                style={{ color: whiteAnalysis.color }}
                                title={whiteAnalysis.explanation}
                              >
                                {whiteAnalysis.icon}
                              </span>
                            )}
                          </span>
                          <span className={`move-san black${moveHistory.length - 1 === index * 2 + 1 ? ' current' : ''}`}>
                            {pair[1]?.san ?? '--'}
                            {pair[1] && blackAnalysis && (
                              <span
                                className="move-analysis-badge-icon"
                                style={{ color: blackAnalysis.color }}
                                title={blackAnalysis.explanation}
                              >
                                {blackAnalysis.icon}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {(latestAnalysis || isAnalyzing) && gameStarted && (
                <div
                  className="move-analysis-toast"
                  style={latestAnalysis ? { borderLeft: `3px solid ${latestAnalysis.color}` } : undefined}
                >
                  {latestAnalysis ? (
                    <>
                      <div className="move-analysis-toast-header">
                        <span className="move-analysis-icon" style={{ color: latestAnalysis.color }}>
                          {latestAnalysis.icon}
                        </span>
                        <span className="move-analysis-classification" style={{ color: latestAnalysis.color }}>
                          {latestAnalysis.classification}
                        </span>
                        {isAnalyzing && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: 'auto' }}>
                            analyzing…
                          </span>
                        )}
                      </div>
                      <p className="move-analysis-explanation">{latestAnalysis.explanation}</p>
                      {latestAnalysis.bestMove && (
                        <p className="move-analysis-best">
                          Best: <strong>{latestAnalysis.bestMove}</strong>
                          {latestAnalysis.bestMoveExplanation ? ` — ${latestAnalysis.bestMoveExplanation}` : ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="move-analysis-pending">Analyzing move…</p>
                  )}
                </div>
              )}

              <div className={`play-clock-card${sideToMove === bottomColor && gameStarted && !gameResult ? ' is-active' : ''}`}>
                <div className="play-clock-copy">
                  <span className="play-clock-icon">{bottomParticipant.icon}</span>
                  <div>
                    <strong>{bottomParticipant.label}</strong>
                    <span>{bottomParticipant.sublabel}</span>
                  </div>
                </div>
                <div className="play-clock-time">{formatClock(timers[bottomColor])}</div>
              </div>

              <div className="play-control-grid">
                <button className="ctrl-btn" type="button" onClick={() => finishGame(getManualResult('resign', sideToMove))}>Resign</button>
                <button className="ctrl-btn" type="button" onClick={() => finishGame(getManualResult('draw', sideToMove))}>Draw</button>
                <button className="ctrl-btn" type="button" onClick={() => startConfiguredGame({ timeConfig })}><HiRefresh /> Restart</button>
                <button className="ctrl-btn" type="button" onClick={() => setBoardOrientation((current) => (current === 'white' ? 'black' : 'white'))} title="Flip board">
                  <HiSwitchHorizontal />
                </button>
              </div>

              <div className="play-control-grid play-control-grid-secondary">
                <button className="ctrl-btn ctrl-btn-secondary" type="button" onClick={() => navigate('/review', { state: reviewPayload })} disabled={!moveHistory.length}>
                  Review Game
                </button>
                <button className="ctrl-btn ctrl-btn-secondary" type="button" onClick={reopenSetup}>
                  New Setup
                </button>
              </div>
            </div>
          </section>
        </div>
      </ChessboardProvider>

      {setupOpen ? (
        <div className="play-setup-backdrop" onClick={closeSetup}>
          <div className="play-setup-card" onClick={(event) => event.stopPropagation()}>
            <div className="play-setup-header">
              <div>
                <p className="play-setup-kicker">{mode === 'engine' ? 'Play vs Stockfish' : 'Pass & Play'}</p>
                <h2>{mode === 'engine' ? 'Game setup' : 'Local game setup'}</h2>
                <p>{opening ? `Starting from ${opening.name}. The board and shell stay exactly in the premium play layout.` : 'Choose your side, clock, and board orientation before the first move.'}</p>
              </div>
              <button
                className="play-setup-close"
                type="button"
                onClick={closeSetup}
                aria-label="Close game setup"
              >
                <HiX />
              </button>
            </div>

            <div className="play-setup-grid">
              {mode === 'engine' ? (
                <div className="play-setup-block">
                  <label>Play as</label>
                  <div className="play-setup-segment">
                    {['white', 'random', 'black'].map((choice) => (
                      <button key={choice} className={`play-setup-choice${setupColor === choice ? ' is-active' : ''}`} type="button" onClick={() => setSetupColor(choice)}>
                        {choice[0].toUpperCase() + choice.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="play-setup-block">
                <label>Time control</label>
                <div className="play-setup-segment">
                  {['bullet', 'blitz', 'rapid', 'custom'].map((preset) => (
                    <button key={preset} className={`play-setup-choice${setupPreset === preset ? ' is-active' : ''}`} type="button" onClick={() => setSetupPreset(preset)}>
                      {preset[0].toUpperCase() + preset.slice(1)}
                    </button>
                  ))}
                </div>
                {setupPreset === 'custom' ? (
                  <div className="play-setup-inline">
                    <label className="play-setup-input">
                      <span>Minutes</span>
                      <input type="number" min="1" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} />
                    </label>
                    <label className="play-setup-input">
                      <span>Increment</span>
                      <input type="number" min="0" value={customIncrement} onChange={(event) => setCustomIncrement(event.target.value)} />
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="play-setup-block">
                <label>Board orientation</label>
                <div className="play-setup-segment">
                  {(mode === 'engine' ? ['auto', 'white', 'black'] : ['white', 'black']).map((choice) => (
                    <button key={choice} className={`play-setup-choice${setupOrientation === choice ? ' is-active' : ''}`} type="button" onClick={() => setSetupOrientation(choice)}>
                      {choice[0].toUpperCase() + choice.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'engine' ? (
                <div className="play-setup-block">
                  <label>Difficulty</label>
                  <div className="play-setup-slider">
                    <input type="range" min="1" max="10" value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value))} />
                    <div className="play-setup-slider-copy">
                      <strong>Level {difficulty}</strong>
                      <span>Mapped to Stockfish depth and skill settings.</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="play-setup-actions">
              <button className="btn btn-primary" type="button" onClick={() => startConfiguredGame()}>
                <HiSelector /> Start game
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <GameResultModal
        open={isResultModalOpen}
        result={gameResult}
        onRematch={() => startConfiguredGame({ timeConfig })}
        onNewGame={reopenSetup}
        onAnalysis={moveHistory.length ? () => navigate('/review', { state: reviewPayload }) : undefined}
        analysisLabel="Review Game"
        onClose={() => setIsResultModalOpen(false)}
      />
    </div>
  );
}
