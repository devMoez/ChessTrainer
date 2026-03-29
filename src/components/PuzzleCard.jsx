import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniBoard from './MiniBoard.jsx';
import { useApp } from '../context/AppContext.jsx';

const difficultyClassMap = {
  'Beginner': 'badge-beginner',
  'Easy': 'badge-beginner',
  'Intermediate': 'badge-intermediate',
  'Advanced': 'badge-advanced'
};

function difficultyClass(d) {
  return difficultyClassMap[d] || 'badge-advanced';
}

const PuzzleCard = memo(function PuzzleCard({ puzzle }) {
  const { boardTheme } = useApp();
  const navigate = useNavigate();

  const handleStart = useCallback(() => {
    navigate('/puzzle', { state: { puzzle } });
  }, [navigate, puzzle]);

  return (
    <article className="opening-card" id={`puzzle-card-${puzzle.id}`}>
      <div className="card-board-area">
        <MiniBoard
          fen={puzzle.fen}
          lightColor={boardTheme.light}
          darkColor={boardTheme.dark}
        />
        <span className={`card-difficulty-badge ${difficultyClass(puzzle.difficulty)}`}>
          {puzzle.difficulty}
        </span>
      </div>

      <div className="card-info">
        <div className="card-title">{puzzle.title}</div>
        
        <p className="card-desc">Practice this tactical pattern to improve your calculation.</p>

        <button
          className="card-study-btn"
          onClick={handleStart}
          aria-label={`Start ${puzzle.title}`}
          id={`start-btn-${puzzle.id}`}
        >
          Start
        </button>
      </div>
    </article>
  );
});

export default PuzzleCard;
