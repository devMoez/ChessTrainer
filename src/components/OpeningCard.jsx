import React, { memo, useCallback } from 'react';
import MiniBoard from './MiniBoard.jsx';
import { Star, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const difficultyClassMap = {
  'Beginner': 'badge-beginner',
  'Intermediate': 'badge-intermediate',
  'Advanced': 'badge-advanced'
};

function difficultyClass(d) {
  return difficultyClassMap[d] || 'badge-advanced';
}

const OpeningCard = memo(function OpeningCard({ opening, onClick, highlighted = false }) {
  const { boardTheme } = useApp();

  const handleClick = useCallback(() => {
    onClick?.(opening);
  }, [onClick, opening]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClick?.(opening);
    }
  }, [onClick, opening]);

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    onClick?.(opening);
  }, [onClick, opening]);

  return (
    <article
      className={`opening-card${highlighted ? ' is-highlighted' : ''}`}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`Study ${opening.name}`}
      onKeyDown={handleKeyDown}
      id={`opening-card-${opening.id}`}
      data-opening-id={opening.id}
    >
      <div className="card-board-area">
        <MiniBoard
          fen={opening.fen}
          lightColor={boardTheme.light}
          darkColor={boardTheme.dark}
          orientation={opening.color === 'Black' ? 'black' : 'white'}
        />
        <span className={`card-difficulty-badge ${difficultyClass(opening.difficulty)}`}>
          {opening.difficulty}
        </span>
      </div>

      <div className="card-info">
        <div className="card-title">{opening.name}</div>

        <div className="card-meta">
          <span className="card-meta-item">
            <TrendingUp size={16} />
            <span className="win-rate-positive">{opening.winRate}%</span>
            <span>win rate</span>
          </span>
          <span className="card-meta-item">
            <Star size={16} />
            <span>{opening.popularity}/100</span>
          </span>
        </div>

        <p className="card-desc">{opening.description}</p>

        <button
          className="card-study-btn"
          onClick={handleButtonClick}
          aria-label={`Study ${opening.name}`}
          id={`study-btn-${opening.id}`}
        >
          Study
        </button>
      </div>
    </article>
  );
});

export default OpeningCard;
