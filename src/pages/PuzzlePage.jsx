import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard.jsx';
import { HiArrowLeft, HiRefresh, HiCheckCircle, HiXCircle, HiLightBulb, HiChevronRight, HiChevronLeft, HiLogout } from 'react-icons/hi';
import { PUZZLES_BY_CATEGORY, PUZZLES } from '../data/puzzles.js';

/**
 * Robust SAN normalization to prevent castling and checking mismatches.
 */
function normalizeSAN(move) {
  if (!move) return '';
  return move
    .replace(/[+#]/g, '')        // Remove check and checkmate
    .replace(/0-0-0/g, 'O-O-O')  // Normalize castling (Long first!)
    .replace(/0-0/g, 'O-O')      // Normalize castling
    .trim();
}

export default function PuzzlePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialPuzzle = location.state?.puzzle;
  
  // Track current puzzle and category
  const [currentPuzzle, setCurrentPuzzle] = useState(initialPuzzle);
  const [categoryPuzzles, setCategoryPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize category puzzles
  useEffect(() => {
    if (initialPuzzle) {
      const puzzles = PUZZLES_BY_CATEGORY[initialPuzzle.category] || [];
      setCategoryPuzzles(puzzles);
      const idx = puzzles.findIndex(p => p.id === initialPuzzle.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setCurrentPuzzle(puzzles[idx >= 0 ? idx : 0] || initialPuzzle);
    }
  }, [initialPuzzle]);

  useEffect(() => {
    if (!currentPuzzle) {
      navigate('/puzzles');
    }
  }, [currentPuzzle, navigate]);

  const [boardPosition, setBoardPosition] = useState(currentPuzzle?.fen || 'start');
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [highlightSquares, setHighlightSquares] = useState({});
  const feedbackTimeoutRef = useRef(null);

  // Sync state when puzzle changes
  useEffect(() => {
    if (currentPuzzle?.fen) {
      setBoardPosition(currentPuzzle.fen);
      setMoveIndex(0);
      setFeedback(null);
      setHighlightSquares({});
    }
  }, [currentPuzzle]);

  const boardOrientation = useMemo(() => {
    if (!currentPuzzle?.fen) return 'white';
    try {
      const game = new Chess(currentPuzzle.fen);
      return game.turn() === 'w' ? 'white' : 'black';
    } catch (e) {
      return 'white';
    }
  }, [currentPuzzle]);

  const isCompleted = moveIndex >= currentPuzzle?.moves.length;

  // Handle move validation
  const handleMove = useCallback(({ sourceSquare, targetSquare }) => {
    if (!currentPuzzle || isCompleted) return false;

    try {
      const gameCopy = new Chess(boardPosition);
      const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;

      const played = normalizeSAN(move.san);
      const expected = normalizeSAN(currentPuzzle.moves[moveIndex]);

      if (played === expected) {
        const newFen = gameCopy.fen();
        setBoardPosition(newFen);
        const nextIndex = moveIndex + 1;
        setMoveIndex(nextIndex);
        setHighlightSquares({});

        setFeedback({ type: 'correct', square: targetSquare });
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 900);

        // Auto-play opponent reply
        if (nextIndex < currentPuzzle.moves.length) {
          setTimeout(() => {
            try {
              const oppGame = new Chess(newFen);
              const oppMoveStr = currentPuzzle.moves[nextIndex];
              oppGame.move(oppMoveStr);
              setBoardPosition(oppGame.fen());
              setMoveIndex(nextIndex + 1);
            } catch (err) {
              console.error("Opponent move error:", err);
            }
          }, 600);
        }
        return true;
      } else {
        setFeedback({ type: 'wrong', square: targetSquare });
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 900);
        return false;
      }
    } catch (e) {
      console.error("Move error:", e);
      return false;
    }
  }, [boardPosition, moveIndex, currentPuzzle, isCompleted]);

  const resetPuzzle = () => {
    setBoardPosition(currentPuzzle?.fen || 'start');
    setMoveIndex(0);
    setFeedback(null);
    setHighlightSquares({});
  };

  const showHint = () => {
    if (!currentPuzzle || isCompleted) return;
    const expectedMoveStr = currentPuzzle.moves[moveIndex];
    if (!expectedMoveStr) return;

    try {
      const game = new Chess(boardPosition);
      const move = game.move(expectedMoveStr);
      if (move) {
        setHighlightSquares({
          [move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
          [move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
        });
      }
    } catch (e) {
      console.error("Hint error:", e);
    }
  };

  const nextPuzzle = () => {
    if (categoryPuzzles.length === 0) {
      navigate('/puzzles');
      return;
    }
    const nextIdx = (currentIndex + 1) % categoryPuzzles.length;
    setCurrentIndex(nextIdx);
    setCurrentPuzzle(categoryPuzzles[nextIdx]);
  };

  const previousPuzzle = () => {
    if (categoryPuzzles.length === 0) return;
    const prevIdx = currentIndex === 0 ? categoryPuzzles.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentPuzzle(categoryPuzzles[prevIdx]);
  };

  const randomPuzzle = () => {
    if (categoryPuzzles.length === 0) return;
    const randomIdx = Math.floor(Math.random() * categoryPuzzles.length);
    setCurrentIndex(randomIdx);
    setCurrentPuzzle(categoryPuzzles[randomIdx]);
  };

  if (!currentPuzzle) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>No puzzle selected</h2>
        <button className="btn btn-primary" onClick={() => navigate('/puzzles')}>Go to Puzzles</button>
      </div>
    );
  }

  return (
    <div className="analysis-redesign-container puzzle-redesign-container">
      <div className="trainer-header">
        <button className="btn-back" onClick={() => navigate('/puzzles')}>
          <HiArrowLeft /> Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1>{currentPuzzle.category}</h1>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {currentPuzzle.difficulty} • Puzzle {currentIndex + 1}/{categoryPuzzles.length}
          </span>
        </div>
      </div>

      <div className="trainer-grid">
        <div className="trainer-board-area">
          <ChessBoard
            fen={boardPosition}
            mode="puzzle"
            onMove={handleMove}
            isLocked={isCompleted}
            orientation={boardOrientation}
            squareStyles={highlightSquares}
            animationDurationInMs={200}
            className="trainer-board-wrapper chessboard-container premium-board-shell"
          >
            {feedback && (
              <div className={`trainer-feedback ${feedback.type}`}>
                {feedback.type === 'correct' ? <HiCheckCircle /> : <HiXCircle />}
              </div>
            )}
          </ChessBoard>
        </div>

        <div className="trainer-controls-area">
          {isCompleted ? (
            <div className="trainer-card completed-card">
              <HiCheckCircle className="success-icon" />
              <h2>Puzzle Solved! 🎉</h2>
              <p>Great job! You found the winning sequence.</p>
              <div className="trainer-actions stacked">
                <button className="btn btn-primary" onClick={nextPuzzle}>
                  <HiChevronRight /> Next Puzzle
                </button>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={previousPuzzle}>
                    <HiChevronLeft /> Previous
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={randomPuzzle}>
                    <HiRefresh /> Random
                  </button>
                </div>
                <button className="btn btn-ghost" onClick={resetPuzzle}>
                  <HiRefresh /> Try Again
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/puzzles')}>
                  <HiLogout /> Exit to Library
                </button>
              </div>
            </div>
          ) : (
            <div className="trainer-card info-card">
              <h3>Solve the Puzzle</h3>
              <p>Find the best sequence of moves for {boardOrientation}.</p>
              
              <div className="trainer-actions stacked">
                <button className="btn btn-ghost" onClick={showHint} title="Show Hint">
                  <HiLightBulb /> Hint
                </button>
                <button className="btn btn-ghost" onClick={resetPuzzle} title="Reset Puzzle">
                  <HiRefresh /> Reset
                </button>
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '16px' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, fontSize: '13px' }} 
                    onClick={previousPuzzle}
                    disabled={categoryPuzzles.length <= 1}
                  >
                    <HiChevronLeft /> Prev
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, fontSize: '13px' }} 
                    onClick={nextPuzzle}
                    disabled={categoryPuzzles.length <= 1}
                  >
                    <HiChevronRight /> Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
