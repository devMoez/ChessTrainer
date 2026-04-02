import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { HiSearch, HiRefresh, HiFilter } from 'react-icons/hi';
import PuzzleCard from '../components/PuzzleCard.jsx';
import { PUZZLES, PUZZLE_CATEGORIES, PUZZLE_DIFFICULTIES } from '../data/puzzles.js';

export default function PuzzlesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  
  // ZERO-FLASH LAYOUT LOGIC
  const [layoutReady, setLayoutReady] = useState(false);
  const containerRef = useRef(null);

  const filteredPuzzles = useMemo(() => {
    return PUZZLES.filter(p => {
      const matchesQuery = p.category.toLowerCase().includes(query.toLowerCase()) ||
                          p.difficulty.toLowerCase().includes(query.toLowerCase()) ||
                          (p.tags && p.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
      const matchesCategory = category === 'All' || p.category === category;
      const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
      
      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [query, category, difficulty]);

  useLayoutEffect(() => {
    setLayoutReady(true);
  }, [filteredPuzzles]);

  return (
    <div className="puzzles-page-container">
      <div className="page-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Puzzle Library</h1>
            <p>Master tactics with real, verified chess positions.</p>
          </div>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div className="filter-search" style={{ flex: '1 1 300px' }}>
          <HiSearch size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search by theme (e.g. fork, pin)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search puzzles"
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '12px' }}>
          <div className="select-wrapper">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="filter-select"
            >
              {PUZZLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="filter-select"
            >
              {PUZZLE_DIFFICULTIES.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="filter-result-count" style={{ marginLeft: 'auto' }}>
          {filteredPuzzles.length} verified puzzle{filteredPuzzles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredPuzzles.length === 0 ? (
        <div className="card-placeholder" style={{ minHeight: 300 }}>
          <p>No puzzles found matching your filters.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setQuery('');
            setCategory('All');
            setDifficulty('All');
          }}>Clear Filters</button>
        </div>
      ) : (
        <div 
          className="puzzle-grid-compact"
          ref={containerRef}
          style={{
            visibility: layoutReady ? 'visible' : 'hidden',
            opacity: layoutReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in',
            minHeight: '600px'
          }}
        >
          {filteredPuzzles.map((puzzle) => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .puzzles-page-container { padding-bottom: 40px; }
        
        .puzzle-grid-compact { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 320px));
          justify-content: center;
          gap: 24px; 
          margin-top: 24px;
        }
        
        @media (min-width: 1400px) {
          .puzzle-grid-compact {
            grid-template-columns: repeat(4, 320px);
          }
        }
        
        @media (min-width: 1024px) and (max-width: 1399px) {
          .puzzle-grid-compact {
            grid-template-columns: repeat(3, 320px);
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .puzzle-grid-compact {
            grid-template-columns: repeat(2, 320px);
          }
        }
        
        @media (max-width: 767px) {
          .puzzle-grid-compact {
            grid-template-columns: 1fr;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
          }
        }
        
        .filter-select {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          min-width: 140px;
        }
        .filter-select:hover {
          border-color: var(--accent-gold);
        }
        .select-wrapper {
          position: relative;
        }
      `}} />
    </div>
  );
}
