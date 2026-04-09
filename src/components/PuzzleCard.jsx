import React, { memo, useCallback, useMemo } from 'react';
import PreviewBoard from './PreviewBoard.jsx';
import { useApp } from '../context/AppContext.jsx';

const difficultyClassMap = {
  'Easy': 'badge-beginner',
  'Intermediate': 'badge-intermediate',
  'Hard': 'badge-advanced',
};

function difficultyClass(d) {
  return difficultyClassMap[d] || 'badge-intermediate';
}

const PuzzleCard = memo(function PuzzleCard({ puzzle, onClick }) {
  const { boardTheme } = useApp();

  const { light, dark } = useMemo(() => ({
    light: boardTheme.light,
    dark: boardTheme.dark,
  }), [boardTheme.light, boardTheme.dark]);

  const handleClick = useCallback(() => {
    onClick?.(puzzle);
  }, [onClick, puzzle]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClick?.(puzzle);
    }
  }, [onClick, puzzle]);

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    onClick?.(puzzle);
  }, [onClick, puzzle]);

  return (
    <article
      className="opening-card"
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`Solve ${puzzle.category}`}
      onKeyDown={handleKeyDown}
      id={`puzzle-card-${puzzle.id}`}
      data-puzzle-id={puzzle.id}
    >
      <div className="card-board-area">
        <PreviewBoard
          fen={puzzle.fen}
          lightColor={light}
          darkColor={dark}
        />
        <span className={`card-difficulty-badge ${difficultyClass(puzzle.difficulty)}`}>
          {puzzle.difficulty}
        </span>
      </div>

      <div className="card-info">
        <div className="card-title">{puzzle.category}</div>

        <p className="card-desc">{puzzle.description}</p>

        <button
          className="card-study-btn"
          onClick={handleButtonClick}
          aria-label={`Solve ${puzzle.category}`}
          type="button"
        >
          Solve
        </button>
      </div>
    </article>
  );
}, (prev, next) => prev.puzzle.id === next.puzzle.id && prev.puzzle.fen === next.puzzle.fen);

export default PuzzleCard;
