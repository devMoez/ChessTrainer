import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useApp } from '../context/AppContext.jsx';
import { HiArrowLeft, HiRefresh, HiLightBulb, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import useChessDragClass from '../hooks/useChessDragClass.js';

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

  const openingData = location.state?.opening;
  const practiceMode = location.state?.practiceMode ?? 'repertoire';
  const returnTo = location.state?.returnTo ?? '/openings';
  const isBothSidesMode = practiceMode === 'both-sides';
  const isPlayerWhite = isBothSidesMode ? true : openingData?.color?.toLowerCase() !== 'black';
  const boardOrientation = isBothSidesMode ? 'white' : (isPlayerWhite ? 'white' : 'black');

  const chessRef = useRef(new Chess());
  const isAIMovingRef = useRef(false); // ref instead of state — no re-render side effects
  const [fen, setFen] = useState(() => new Chess().fen());
  const [moves, setMoves] = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Parse moves
  useEffect(() => {
    if (!openingData?.moves) return;
    const parsed = openingData.moves
      .replace(/\d+\.\s*/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    console.log('PARSED MOVES:', parsed);
    chessRef.current = new Chess();
    isAIMovingRef.current = false;
    setFen(chessRef.current.fen());
    setMoves(parsed);
    setMoveIndex(0);
    setFeedback(null);
    setShowHint(false);
  }, [openingData]);

  // AI move effect — only depends on fen and moveIndex, not isAIMoving
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

  // v5 API: receives sourceSquare, targetSquare, piece
  function onPieceDrop(sourceSquare, targetSquare, piece) {
    console.log('DROP CALLED', sourceSquare, targetSquare, 'moveIndex:', moveIndex, 'moves.length:', moves.length);

    if (isAIMovingRef.current) {
      clearPieceDrag();
      return false;
    }
    if (moveIndex >= moves.length) {
      clearPieceDrag();
      return false;
    }

    const isWhiteTurn = chessRef.current.turn() === 'w';
    if (!isBothSidesMode && isWhiteTurn !== isPlayerWhite) {
      clearPieceDrag();
      return false;
    }

    const testChess = new Chess(chessRef.current.fen());
    let move;
    try {
      move = testChess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    } catch {
      clearPieceDrag();
      return false;
    }
    if (!move) {
      clearPieceDrag();
      return false;
    }

    const normalize = s => s.replace(/[+#]/g, '').replace(/0/g, 'O').trim();
    const played = normalize(move.san);
    const expected = normalize(moves[moveIndex]);
    console.log('played:', played, 'expected:', expected);

    if (played !== expected) {
      setFeedback('wrong');
      setShowHint(true);
      setTimeout(() => setFeedback(null), 800);
      clearPieceDrag();
      return false;
    }

    chessRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    setFen(chessRef.current.fen());
    setMoveIndex(prev => prev + 1);
    setFeedback('correct');
    setShowHint(false);
    setTimeout(() => setFeedback(null), 800);
    clearPieceDrag();
    return true;
  }

  function showCorrectMove() {
    if (moveIndex >= moves.length) return;
    if (isAIMovingRef.current) return;
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
    setFeedback(null);
    setShowHint(false);
  }

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
          onClick={() => navigate(returnTo)}
        >
          <HiArrowLeft /> Back
        </button>
        <h1 style={{ fontSize: 24, margin: 0 }}>{openingData.name}</h1>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `minmax(300px, ${boardWidth + 20}px) 340px`,
        gap: 32,
        justifyContent: 'center',
      }}>
        {/* Board */}
        <div>
          <div style={{
            position: 'relative', background: 'var(--bg-surface)',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
          }} className="opening-trainer-board-shell">
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
              animationDurationInMs={200}
            />

            {feedback && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 80, zIndex: 100, pointerEvents: 'none',
                color: feedback === 'correct' ? 'var(--accent-green)' : 'var(--accent-red)',
                animation: 'feedbackPop 0.5s ease forwards',
              }}>
                {feedback === 'correct' ? <HiCheckCircle /> : <HiXCircle />}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {isFinished ? (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--accent-green)',
              borderRadius: 16, padding: 24, textAlign: 'center',
            }}>
              <HiCheckCircle style={{ fontSize: 48, color: 'var(--accent-green)', marginBottom: 16 }} />
              <h2>Opening Learned!</h2>
              <button
                style={{
                  background: 'var(--accent-gold)', border: 'none', color: '#1a1400',
                  padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
                }}
                onClick={resetTrainer}
              >
                <HiRefresh /> Practice Again
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 18, margin: '0 0 12px 0' }}>Instructions</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                {isBothSidesMode ? (
                  <>Play both sides of the line in order.</>
                ) : (
                  <>Play for <strong>{openingData.color}</strong></>
                )}
              </p>

              {showHint && moveIndex < moves.length && (
                <div style={{
                  background: 'var(--accent-gold-10)', border: '1px solid var(--accent-gold-20)',
                  borderRadius: 12, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14 }}>
                    <HiLightBulb style={{ color: 'var(--accent-gold)', fontSize: 20 }} />
                    <span>Correct move: <strong>{moves[moveIndex]}</strong></span>
                  </div>
                  <button
                    style={{
                      width: '100%', padding: 8, background: 'var(--accent-gold)',
                      color: '#1a1400', border: 'none', borderRadius: 6,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                    onClick={showCorrectMove}
                  >
                    Show Move
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', padding: '8px 12px',
                    borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onClick={resetTrainer}
                >
                  <HiRefresh /> Reset
                </button>
                <button
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', padding: '8px 12px',
                    borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onClick={() => setShowHint(true)}
                >
                  <HiLightBulb /> Get Hint
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes feedbackPop {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
