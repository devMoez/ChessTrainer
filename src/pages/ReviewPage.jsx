import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiChevronLeft,
  HiChevronRight,
  HiRefresh,
  HiSwitchHorizontal,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext.jsx';
import EvalBar from '../components/EvalBar.jsx';
import { getPieceRenderers } from '../chess/pieceRenderers.jsx';
import ReviewEngine from '../chess/ReviewEngine.js';
import { findAttackersOfSquare, findKingSquare } from '../chess/analysisHelpers.js';

const DEFAULT_BOARD_PX = 756;
const REVIEW_COLORS = Object.freeze({
  best: { label: 'Best', color: 'rgba(76, 175, 80, 0.88)', className: 'review-best' },
  excellent: { label: 'Excellent', color: 'rgba(92, 197, 127, 0.84)', className: 'review-best' },
  good: { label: 'Good', color: 'rgba(76, 143, 230, 0.84)', className: 'review-good' },
  inaccuracy: { label: 'Inaccuracy', color: 'rgba(255, 213, 79, 0.9)', className: 'review-inaccuracy' },
  mistake: { label: 'Mistake', color: 'rgba(244, 143, 76, 0.9)', className: 'review-mistake' },
  blunder: { label: 'Blunder', color: 'rgba(229, 57, 53, 0.9)', className: 'review-blunder' },
});

function groupMoves(moves) {
  const rows = [];
  for (let index = 0; index < moves.length; index += 2) {
    rows.push({
      number: Math.floor(index / 2) + 1,
      white: moves[index] ?? null,
      black: moves[index + 1] ?? null,
    });
  }
  return rows;
}

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { boardTheme, pieceStyle } = useApp();
  const reviewData = location.state?.reviewData ?? null;

  const boardWrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(DEFAULT_BOARD_PX);
  const [orientation, setOrientation] = useState('white');
  const [positionIndex, setPositionIndex] = useState(0);
  const [review, setReview] = useState(null);
  const [status, setStatus] = useState(reviewData ? 'loading' : 'empty');
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!reviewData) return undefined;

    const engine = new ReviewEngine();
    let cancelled = false;

    engine.analyzeGame(reviewData)
      .then((result) => {
        if (cancelled) return;
        setReview(result);
        setPositionIndex(Math.min(result.positions.length - 1, result.moves.length));
        setStatus('ready');
      })
      .catch((reason) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'Unable to review this game.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
      engine.destroy();
    };
  }, [reviewData]);

  useEffect(() => {
    if (status !== 'ready') return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        setPositionIndex((current) => Math.max(0, current - 1));
      } else if (event.key === 'ArrowRight') {
        setPositionIndex((current) => Math.min((review?.positions.length ?? 1) - 1, current + 1));
      } else if (event.key === 'Home') {
        setPositionIndex(0);
      } else if (event.key === 'End') {
        setPositionIndex((review?.positions.length ?? 1) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [review?.positions.length, status]);

  const squarePx = useMemo(() => Math.max(1, boardPx / 8), [boardPx]);
  const customPieces = useMemo(
    () => getPieceRenderers(pieceStyle, squarePx),
    [pieceStyle, squarePx]
  );

  const currentPosition = review?.positions[positionIndex] ?? null;
  const currentMove = positionIndex > 0 ? review?.moves[positionIndex - 1] ?? null : null;
  const currentGame = (() => {
    if (!currentPosition?.fen) return null;
    try {
      return new Chess(currentPosition.fen);
    } catch {
      return null;
    }
  })();

  const checkSquare = useMemo(() => {
    if (!currentGame || !currentGame.isCheck()) return null;
    return findKingSquare(currentGame, currentGame.turn());
  }, [currentGame]);

  const checkAttackers = useMemo(() => {
    if (!currentGame || !checkSquare) return new Set();
    return findAttackersOfSquare(currentGame, checkSquare, currentGame.turn() === 'w' ? 'b' : 'w');
  }, [checkSquare, currentGame]);

  const moveRows = useMemo(() => groupMoves(review?.moves ?? []), [review?.moves]);
  const currentTone = currentMove ? REVIEW_COLORS[currentMove.category] ?? REVIEW_COLORS.good : null;
  const highlightSquares = useMemo(
    () => (currentMove ? new Set([currentMove.from, currentMove.to].filter(Boolean)) : new Set()),
    [currentMove]
  );

  const reviewArrows = useMemo(() => {
    if (!currentMove) return [];

    const arrows = [
      {
        startSquare: currentMove.from,
        endSquare: currentMove.to,
        color: currentTone?.color ?? REVIEW_COLORS.good.color,
      },
    ];

    if (
      ['inaccuracy', 'mistake', 'blunder'].includes(currentMove.category)
      && currentMove.bestMove?.from
      && currentMove.bestMove?.to
    ) {
      arrows.push({
        startSquare: currentMove.bestMove.from,
        endSquare: currentMove.bestMove.to,
        color: REVIEW_COLORS.best.color,
      });
    }

    return arrows;
  }, [currentMove, currentTone?.color]);

  const squareRenderer = useCallback(({ square, children }) => {
    const isCurrentFrom = currentMove?.from === square;
    const isCurrentTo = currentMove?.to === square;
    const isCheck = checkSquare === square;
    const isAttacker = checkAttackers.has(square);
    const hasReviewTone = highlightSquares.has(square) && currentTone;

    return (
      <div className="premium-square">
        {isCurrentFrom ? <div className="premium-last-move from" /> : null}
        {isCurrentTo ? <div className="premium-last-move to" /> : null}
        {isCheck ? <div className="premium-check-glow" /> : null}
        {isAttacker ? <div className="premium-check-attacker" /> : null}
        {hasReviewTone ? <div className={`review-square-overlay ${currentTone.className}`} /> : null}
        <div className="premium-square-content">{children}</div>
      </div>
    );
  }, [checkAttackers, checkSquare, currentMove?.from, currentMove?.to, currentTone, highlightSquares]);

  const boardOptions = useMemo(() => {
    const options = {
      id: 'review-board',
      position: currentPosition?.fen,
      boardOrientation: orientation,
      arrows: reviewArrows,
      allowDragging: false,
      allowDragOffBoard: false,
      allowDrawingArrows: false,
      showNotation: true,
      animationDurationInMs: 120,
      lightSquareStyle: { backgroundColor: boardTheme.light },
      darkSquareStyle: { backgroundColor: boardTheme.dark },
      squareRenderer,
    };

    if (customPieces) {
      options.pieces = customPieces;
    }

    return options;
  }, [
    boardTheme.dark,
    boardTheme.light,
    currentPosition?.fen,
    customPieces,
    orientation,
    reviewArrows,
    squareRenderer,
  ]);

  if (status === 'empty') {
    return (
      <div className="analysis-redesign-container review-empty-state">
        <h2>No game loaded for review</h2>
        <p>Finish a game first, then open review from the result modal.</p>
        <button className="btn btn-primary" type="button" onClick={() => navigate('/play')}>
          Back to Play
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="analysis-redesign-container review-empty-state">
        <h2>Reviewing game</h2>
        <p>Stockfish is evaluating every position in the background.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="analysis-redesign-container review-empty-state">
        <h2>Review unavailable</h2>
        <p>{error}</p>
        <button className="btn btn-primary" type="button" onClick={() => navigate('/play')}>
          Back to Play
        </button>
      </div>
    );
  }

  return (
    <div className="analysis-redesign-container review-page-shell">
      <ChessboardProvider options={boardOptions}>
        <div className="analysis-grid">
          <section className="board-column">
            <div className="analysis-board-stage">
              <div className="analysis-board-eval-row">
                <div ref={boardWrapRef} className="chessboard-container premium-board-shell">
                  <Chessboard />
                </div>
                <div className="analysis-side-rail">
                  <div className="analysis-eval-shell">
                    <EvalBar
                      percent={currentPosition?.evaluation.percent ?? 50}
                      scoreText={currentPosition?.evaluation.scoreText ?? '0.0'}
                      height={boardPx}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="analysis-board-summary">
              <span className="analysis-board-chip">Accuracy <strong>{review?.accuracy}%</strong></span>
              <span className="analysis-board-chip">Position <strong>{positionIndex}/{(review?.positions.length ?? 1) - 1}</strong></span>
              {reviewData?.title ? <span className="analysis-board-chip">Source <strong>{reviewData.title}</strong></span> : null}
              {reviewData?.opening?.name ? <span className="analysis-board-chip">Opening <strong>{reviewData.opening.name}</strong></span> : null}
            </div>
          </section>

          <section className="controls-column">
            <div className="review-panel">
              <div className="review-insight-card">
                <span className="review-card-kicker">Smart Insight</span>
                <p>{review?.insight}</p>
              </div>

              <div className="review-summary-grid">
                {Object.entries(review?.counts ?? {}).map(([key, count]) => (
                  <div key={key} className="review-summary-item">
                    <span className={`review-badge ${REVIEW_COLORS[key]?.className ?? ''}`} />
                    <div>
                      <strong>{count}</strong>
                      <span>{REVIEW_COLORS[key]?.label ?? key}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="review-navigation">
                <div className="review-nav-buttons">
                  <button className="move-ctrl-btn" type="button" onClick={() => setPositionIndex(0)}><HiChevronDoubleLeft /></button>
                  <button className="move-ctrl-btn" type="button" onClick={() => setPositionIndex((current) => Math.max(0, current - 1))}><HiChevronLeft /></button>
                  <button className="move-ctrl-btn" type="button" onClick={() => setPositionIndex((current) => Math.min((review?.positions.length ?? 1) - 1, current + 1))}><HiChevronRight /></button>
                  <button className="move-ctrl-btn" type="button" onClick={() => setPositionIndex((review?.positions.length ?? 1) - 1)}><HiChevronDoubleRight /></button>
                  <button className="move-ctrl-btn" type="button" onClick={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}><HiSwitchHorizontal /></button>
                  <button className="move-ctrl-btn" type="button" onClick={() => setPositionIndex(Math.min(review?.positions.length ?? 1, review?.moves.length ?? 0))}><HiRefresh /></button>
                </div>

                <input className="review-timeline" type="range" min="0" max={(review?.positions.length ?? 1) - 1} value={positionIndex} onChange={(event) => setPositionIndex(Number(event.target.value))} />
              </div>

              <div className="review-focus-card">
                {currentMove ? (
                  <>
                    <div className="review-focus-header">
                      <span className={`review-badge ${currentTone?.className ?? ''}`} />
                      <strong>{currentMove.categoryLabel}</strong>
                    </div>
                    <p>Move {currentMove.index + 1}: <strong>{currentMove.san}</strong> with a {currentMove.loss} cp loss.</p>
                    <p>Best move: <strong>{currentMove.bestSan || '--'}</strong></p>
                  </>
                ) : (
                  <p>The start position is loaded. Step forward to inspect each move.</p>
                )}
              </div>

              <div className="review-move-list">
                <div className="move-list-header">Move Tracker</div>
                <div className="move-list-body">
                  {moveRows.map((row) => (
                    <div key={row.number} className="move-pair">
                      <span className="move-num">{row.number}.</span>
                      {row.white ? (
                        <button className={`review-move-btn${positionIndex === row.white.index + 1 ? ' current' : ''}`} type="button" onClick={() => setPositionIndex(row.white.index + 1)}>
                          <span className={`review-badge ${REVIEW_COLORS[row.white.category]?.className ?? ''}`} />
                          {row.white.san}
                        </button>
                      ) : <span className="review-move-btn empty">--</span>}
                      {row.black ? (
                        <button className={`review-move-btn${positionIndex === row.black.index + 1 ? ' current' : ''}`} type="button" onClick={() => setPositionIndex(row.black.index + 1)}>
                          <span className={`review-badge ${REVIEW_COLORS[row.black.category]?.className ?? ''}`} />
                          {row.black.san}
                        </button>
                      ) : <span className="review-move-btn empty">--</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </ChessboardProvider>
    </div>
  );
}
