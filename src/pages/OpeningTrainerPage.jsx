import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useApp } from '../context/AppContext.jsx';
import {
  HiArrowLeft, HiRefresh, HiLightBulb, HiCheckCircle,
} from 'react-icons/hi';
import useChessDragClass from '../hooks/useChessDragClass.js';
import { useOpeningLines } from '../hooks/useOpeningLines.js';
import { useMoveValidation } from '../hooks/useMoveValidation.js';
import LineSelector from '../components/LineSelector.jsx';
import LineNavigator from '../components/LineNavigator.jsx';
import RepetitionCounter from '../components/RepetitionCounter.jsx';
import MoveIndicator from '../components/MoveIndicator.jsx';

export default function OpeningTrainerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { boardTheme } = useApp();
  const {
    clearPieceDrag,
    draggingPieceGhostStyle,
    draggingPieceStyle,
    handlePieceDragStart,
  } = useChessDragClass();

  const openingData  = location.state?.opening;
  const practiceMode = location.state?.practiceMode ?? 'repertoire';
  const returnTo     = location.state?.returnTo ?? '/openings';
  const isBothSidesMode = practiceMode === 'both-sides';
  const isPlayerWhite   = isBothSidesMode ? true : openingData?.color?.toLowerCase() !== 'black';
  const boardOrientation = isBothSidesMode ? 'white' : (isPlayerWhite ? 'white' : 'black');

  // ── Line management (selection + rep tracking) ────────────

  const {
    lines,
    selectedLine,
    selectedLineIdx,
    selectedLineStats,
    getLineStats,
    selectLine,
    prevLine,
    nextLine,
    incrementRep,
    isFirst,
    isLast,
    totalLines,
  } = useOpeningLines(openingData);

  // ── Board / trainer state ─────────────────────────────────

  const chessRef      = useRef(new Chess());
  const isAIMovingRef = useRef(false);
  const [fen, setFen] = useState(() => new Chess().fen());
  const [moves, setMoves]         = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [showHint, setShowHint]   = useState(false);

  // completedVariations: tracks which line indices are done (for isFinished glow)
  const [completedVariations, setCompletedVariations] = useState(new Set());

  // ── Move validation + corner feedback ─────────────────────
  const { feedback, onSuccess, onError } =
    useMoveValidation(chessRef, moves, moveIndex);

  // ── Re-initialise board whenever the selected line changes ─

  useEffect(() => {
    if (!selectedLine?.moves) return;

    const parsed = selectedLine.moves
      .replace(/\d+\.\s*/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    chessRef.current  = new Chess();
    isAIMovingRef.current = false;
    setFen(chessRef.current.fen());
    setMoves(parsed);
    setMoveIndex(0);
    setShowHint(false);
  }, [selectedLine]);

  // ── AI auto-move ──────────────────────────────────────────

  useEffect(() => {
    if (isBothSidesMode) return undefined;
    if (moves.length === 0) return;
    if (moveIndex >= moves.length) return;
    if (isAIMovingRef.current) return;

    const isWhiteTurn = chessRef.current.turn() === 'w';
    const aiShouldMove = isWhiteTurn !== isPlayerWhite;
    if (!aiShouldMove) return;

    isAIMovingRef.current = true;

    const timer = setTimeout(() => {
      const san = moves[moveIndex].replace(/0/g, 'O');
      try {
        const result = chessRef.current.move(san);
        if (result) {
          setFen(chessRef.current.fen());
          setMoveIndex(prev => prev + 1);
        }
      } catch (e) {
        console.error('AI move error:', e);
      }
      isAIMovingRef.current = false;
    }, 600);

    return () => {
      clearTimeout(timer);
      isAIMovingRef.current = false;
    };
  }, [fen, isBothSidesMode, moveIndex, moves, isPlayerWhite]);

  // ── Mark line complete when all moves are played ──────────

  useEffect(() => {
    if (moves.length > 0 && moveIndex >= moves.length) {
      setCompletedVariations(prev => new Set(prev).add(selectedLineIdx));
    }
  }, [moveIndex, moves.length, selectedLineIdx]);

  // ── Keyboard shortcuts ────────────────────────────────────
  // ArrowLeft  → prev line
  // ArrowRight → next line
  // r          → +1 rep

  useEffect(() => {
    function onKey(e) {
      // Skip when typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.target.isContentEditable) return;

      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevLine(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextLine(); }
      if (e.key === 'r' || e.key === 'R') incrementRep();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevLine, nextLine, incrementRep]);

  // ── onPieceDrop — validate source + target square ───────────────────
  //
  // Returning false causes react-chessboard's built-in snap-back (no extra CSS needed).
  // All validation happens here so pieces are always freely draggable
  // (react-chessboard's isDraggablePiece is intentionally not used — it was
  // blocking the correct piece too due to stale closure timing with chess.js state).

  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
    if (isAIMovingRef.current)     { clearPieceDrag(); return false; }
    if (moveIndex >= moves.length) { clearPieceDrag(); return false; }

    const isWhiteTurn = chessRef.current.turn() === 'w';
    if (!isBothSidesMode && isWhiteTurn !== isPlayerWhite) {
      clearPieceDrag();
      return false;
    }

    // Try the move on a scratch instance to get its SAN
    const testChess = new Chess(chessRef.current.fen());
    let move;
    try {
      move = testChess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    } catch {
      onError();
      clearPieceDrag();
      return false;
    }
    if (!move) { onError(); clearPieceDrag(); return false; }

    // Compare normalised SAN (strip +/# and unify castling notation)
    const normalize  = s => s.replace(/[+#]/g, '').replace(/0/g, 'O').trim();
    const isCorrect  = normalize(move.san) === normalize(moves[moveIndex]);

    if (!isCorrect) {
      onError();           // red X in corner (400 ms)
      setShowHint(true);   // reveal hint panel
      clearPieceDrag();
      return false;        // react-chessboard snaps piece back
    }

    // ✅ Correct move — commit it
    chessRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    setFen(chessRef.current.fen());
    setMoveIndex(prev => prev + 1);
    onSuccess();       // green ✓ in corner (400 ms)
    setShowHint(false);
    clearPieceDrag();
    return true;
  }, [moveIndex, moves, isBothSidesMode, isPlayerWhite, onSuccess, onError, clearPieceDrag]);

  // ── Utility actions ───────────────────────────────────────

  function showCorrectMove() {
    if (moveIndex >= moves.length || isAIMovingRef.current) return;
    try {
      const result = chessRef.current.move(moves[moveIndex].replace(/0/g, 'O'));
      if (result) {
        setFen(chessRef.current.fen());
        setMoveIndex(prev => prev + 1);
        setShowHint(false);
      }
    } catch (e) {
      console.error('Show move error:', e);
    }
  }

  function resetTrainer() {
    chessRef.current = new Chess();
    isAIMovingRef.current = false;
    setFen(chessRef.current.fen());
    setMoveIndex(0);
    setShowHint(false);
    // feedback auto-clears via useMoveValidation timer — nothing to reset here
  }

  const handleRepeatLine = useCallback(() => resetTrainer(), []);

  // Switching lines via the navigator/selector also resets the board (handled by the selectedLine useEffect)
  const handleSelectLine = useCallback((idx) => {
    selectLine(idx);
    // Board reset happens in the selectedLine useEffect automatically
  }, [selectLine]);

  // ── Guard: no opening selected ────────────────────────────

  if (!openingData) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>No opening selected</h2>
        <button className="btn btn-primary" onClick={() => navigate('/openings')}>
          Go to Openings
        </button>
      </div>
    );
  }

  const boardWidth = Math.min(520, window.innerWidth - 100);
  const isFinished = moves.length > 0 && moveIndex >= moves.length;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
          onClick={() => navigate(returnTo)}
        >
          <HiArrowLeft /> Back
        </button>
        <h1 style={{ fontSize: 24, margin: 0 }}>{openingData.name}</h1>
      </div>

      {/* ── Two-column grid: board | sidebar ─────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `minmax(300px, ${boardWidth + 20}px) 340px`,
        gap: 32,
        justifyContent: 'center',
      }}>

        {/* ── Board column ─────────────────────────────────── */}
        <div>
          <div style={{
            position: 'relative',
            background: 'var(--bg-surface)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}>
            <Chessboard
              id="opening-trainer-board"
              position={fen}
              boardOrientation={boardOrientation}
              onPieceDrop={onPieceDrop}
              onPieceDrag={handlePieceDragStart}
              draggingPieceStyle={draggingPieceStyle}
              draggingPieceGhostStyle={draggingPieceGhostStyle}
              arePremovesAllowed={true}
              clearPremovesOnRightClick={true}
              customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
              customLightSquareStyle={{ backgroundColor: boardTheme.light }}
              animationDurationInMs={150}
            />

            {/* Corner feedback indicator — pointer-events:none so it never blocks drags */}
            <MoveIndicator feedback={feedback} />
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Line selector — always visible */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Line
            </div>

            {/* Dropdown */}
            <LineSelector
              lines={lines}
              selectedIdx={selectedLineIdx}
              onSelect={handleSelectLine}
              getLineStats={getLineStats}
              difficulty={openingData.difficulty}
            />

            {/* Prev / Next navigator */}
            <LineNavigator
              selectedIdx={selectedLineIdx}
              total={totalLines}
              onPrev={prevLine}
              onNext={nextLine}
              isFirst={isFirst}
              isLast={isLast}
            />
          </div>

          {/* Repetition counter */}
          <RepetitionCounter
            stats={selectedLineStats}
            onIncrement={incrementRep}
            isReady={isFinished}
          />

          {/* Training panel */}
          {isFinished ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-green)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
            }}>
              <HiCheckCircle style={{ fontSize: 48, color: 'var(--accent-green)', marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 16px' }}>Line Complete!</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  style={{
                    background: 'var(--accent-gold)', border: 'none',
                    color: '#1a1400', padding: '10px 20px', borderRadius: 8,
                    fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                  }}
                  onClick={handleRepeatLine}
                >
                  <HiRefresh /> Practice Again
                </button>
                {!isLast && (
                  <button
                    style={{
                      background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 8,
                      fontWeight: 600, cursor: 'pointer',
                    }}
                    onClick={nextLine}
                  >
                    Next Line →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}>
              <h3 style={{ fontSize: 16, margin: '0 0 10px 0' }}>Instructions</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                {isBothSidesMode
                  ? 'Play both sides of the line in order.'
                  : <>Play for <strong>{openingData.color}</strong></>}
              </p>

              {/* Hint panel */}
              {showHint && moveIndex < moves.length && (
                <div style={{
                  background: 'var(--accent-gold-10)',
                  border: '1px solid var(--accent-gold-20)',
                  borderRadius: 12, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14 }}>
                    <HiLightBulb style={{ color: 'var(--accent-gold)', fontSize: 20 }} />
                    <span>Correct move: <strong>{moves[moveIndex]}</strong></span>
                  </div>
                  <button
                    style={{
                      width: '100%', padding: 8,
                      background: 'var(--accent-gold)', color: '#1a1400',
                      border: 'none', borderRadius: 6,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                    onClick={showCorrectMove}
                  >
                    Show Move
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={{
                    flex: 1, background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', padding: '8px 12px',
                    borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onClick={resetTrainer}
                >
                  <HiRefresh /> Reset
                </button>
                <button
                  style={{
                    flex: 1, background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', padding: '8px 12px',
                    borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onClick={() => setShowHint(true)}
                >
                  <HiLightBulb /> Hint
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
        Keyboard: <kbd style={kbdStyle}>←</kbd> prev line &nbsp;
        <kbd style={kbdStyle}>→</kbd> next line &nbsp;
        <kbd style={kbdStyle}>R</kbd> +1 rep
      </p>

      <style>{`
        @keyframes moveIndicatorOut {
          0%   { opacity: 1; transform: scale(1);   }
          75%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}

const kbdStyle = {
  display: 'inline-block',
  padding: '1px 6px',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 11,
};
