import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard.jsx';
import { HiArrowLeft, HiRefresh, HiCheckCircle, HiXCircle, HiLightBulb, HiChevronRight, HiLogout } from 'react-icons/hi';

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

  const puzzle = location.state?.puzzle;

  useEffect(() => {
    if (!puzzle) {
      navigate('/puzzles');
    }
  }, [puzzle, navigate]);

  const [boardPosition, setBoardPosition] = useState(puzzle?.fen || 'start');
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', square: string }
  const [highlightSquares, setHighlightSquares] = useState({});
  const feedbackTimeoutRef = useRef(null);

  // Sync state if navigation brings a new puzzle
  useEffect(() => {
    if (puzzle?.fen) {
      setBoardPosition(puzzle.fen);
      setMoveIndex(0);
      setFeedback(null);
      setHighlightSquares({});
    }
  }, [puzzle]);

  const boardOrientation = useMemo(() => {
    if (!puzzle?.fen) return 'white';
    try {
      const game = new Chess(puzzle.fen);
      return game.turn() === 'w' ? 'white' : 'black';
    } catch (e) {
      return 'white';
    }
  }, [puzzle]);

  const isCompleted = moveIndex >= puzzle?.moves.length;

  // Handle move validation
  const handleMove = useCallback(({ sourceSquare, targetSquare }) => {
    if (!puzzle || isCompleted) return false;

    try {
      const gameCopy = new Chess(boardPosition);
      const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;

      const played = normalizeSAN(move.san);
      const expected = normalizeSAN(puzzle.moves[moveIndex]);

      if (played === expected) {
        const newFen = gameCopy.fen();
        setBoardPosition(newFen);
        const nextIndex = moveIndex + 1;
        setMoveIndex(nextIndex);
        setHighlightSquares({}); // Clear hints on correct move

        setFeedback({ type: 'correct', square: targetSquare });
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 900);

        // Auto-play opponent reply
        if (nextIndex < puzzle.moves.length) {
          setTimeout(() => {
            try {
              const oppGame = new Chess(newFen);
              const oppMoveStr = puzzle.moves[nextIndex];
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
  }, [boardPosition, moveIndex, puzzle, isCompleted]);

  const resetPuzzle = () => {
    setBoardPosition(puzzle?.fen || 'start');
    setMoveIndex(0);
    setFeedback(null);
    setHighlightSquares({});
  };

  const showHint = () => {
    if (!puzzle || isCompleted) return;
    const expectedMoveStr = puzzle.moves[moveIndex];
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
    navigate('/puzzles');
  };

  if (!puzzle) {
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
        <h1>{puzzle.title}</h1>
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
              
              <div className="trainer-actions">
                <button className="btn btn-ghost" onClick={showHint} title="Show Hint">
                  <HiLightBulb /> Hint
                </button>
                <button className="btn btn-ghost" onClick={resetPuzzle} title="Reset Puzzle">
                  <HiRefresh /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
