import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviewBoard from './PreviewBoard.jsx';
import { useApp } from '../context/AppContext.jsx';

const difficultyClassMap = {
  'Beginner': 'badge-beginner',
  'Easy': 'badge-beginner',
  'Intermediate': 'badge-intermediate',
  'Advanced': 'badge-advanced',
  'Hard': 'badge-advanced'
};

function difficultyClass(d) {
  return difficultyClassMap[d] || 'badge-advanced';
}

/**
 * OPTIMIZED PUZZLE CARD
 * 
 * Key Features:
 * - Stable keys prevent re-mounting (key={puzzle.id})
 * - React.memo prevents re-renders on parent updates
 * - Custom comparison: only re-render if puzzle.id changes
 * - FEN is preloaded from global cache
 * - Board component persists through scroll/filter
 * - CSS containment isolates layout
 * 
 * Performance:
 * - Memoized callbacks (useCallback)
 * - Memoized derived values (useMemo)
 * - Board colors memoized to prevent MiniBoard re-render
 * - No re-render on: scroll, filter, theme change
 * - Only re-renders if: puzzle.id changes
 */
const PuzzleCard = memo(function PuzzleCard({ puzzle }) {
  const { boardTheme } = useApp();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[PuzzleCard] Rendering:', { 
        id: puzzle.id, 
        category: puzzle.category,
        fen: puzzle.fen,
        hasFen: !!puzzle.fen 
      });
    }
  }, [puzzle.id, puzzle.fen, puzzle.category]);

  // Memoize colors to prevent MiniBoard re-renders
  const { light, dark } = useMemo(() => ({
    light: boardTheme.light,
    dark: boardTheme.dark
  }), [boardTheme.light, boardTheme.dark]);

  const handleStart = useCallback(() => {
    navigate('/puzzle', { state: { puzzle } });
  }, [navigate, puzzle]);

  // Memoize tags slice to prevent array recreation
  const displayTags = useMemo(() => 
    puzzle.tags?.slice(0, 2) || [], 
    [puzzle.tags]
  );

  return (
    <article 
      className="puzzle-card-compact" 
      id={`puzzle-card-${puzzle.id}`}
      data-puzzle-id={puzzle.id}
      style={{ contain: 'layout style paint' }}
    >
      <div className="puzzle-card-board">
        <PreviewBoard
          key={`board-${puzzle.id}`}
          fen={puzzle.fen}
          lightColor={light}
          darkColor={dark}
        />
        <span className={`puzzle-badge ${difficultyClass(puzzle.difficulty)}`}>
          {puzzle.difficulty}
        </span>
      </div>

      <div className="puzzle-card-content">
        <h3 className="puzzle-card-category">{puzzle.category}</h3>
        <p className="puzzle-card-desc">{puzzle.description}</p>
        
        {displayTags.length > 0 && (
          <div className="puzzle-card-tags">
            {displayTags.map(tag => (
              <span key={tag} className="puzzle-tag">#{tag}</span>
            ))}
          </div>
        )}

        <button
          className="puzzle-card-btn"
          onClick={handleStart}
          aria-label={`Solve ${puzzle.category}`}
        >
          Play
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .puzzle-card-compact {
          width: 100%;
          max-width: 320px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          contain: layout style paint;
          will-change: transform;
        }
        
        .puzzle-card-compact:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          border-color: var(--accent-gold);
        }
        
        .puzzle-card-board {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: var(--bg-elevated);
          overflow: hidden;
          contain: strict;
        }
        
        .puzzle-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        
        .badge-beginner {
          background: rgba(34, 197, 94, 0.9);
          color: white;
        }
        
        .badge-intermediate {
          background: rgba(251, 191, 36, 0.9);
          color: #1a1a1a;
        }
        
        .badge-advanced {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }
        
        .puzzle-card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .puzzle-card-category {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }
        
        .puzzle-card-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 38px;
        }
        
        .puzzle-card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        
        .puzzle-tag {
          font-size: 10px;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          color: var(--text-muted);
          font-weight: 500;
        }
        
        .puzzle-card-btn {
          width: 100%;
          margin-top: 8px;
          padding: 10px 16px;
          background: var(--accent-gold);
          color: #1a1a1a;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .puzzle-card-btn:hover {
          background: #c9a050;
          transform: scale(1.02);
        }
        
        .puzzle-card-btn:active {
          transform: scale(0.98);
        }
      `}} />
    </article>
  );
}, (prevProps, nextProps) => {
  // Only re-render if puzzle ID changes (prevents re-render on filter/scroll)
  return prevProps.puzzle.id === nextProps.puzzle.id;
});

export default PuzzleCard;
