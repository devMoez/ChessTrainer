import React, { useState, useMemo, useEffect } from 'react';
import { HiSearch, HiRefresh } from 'react-icons/hi';
import PuzzleCard from '../components/PuzzleCard.jsx';
import { PUZZLES } from '../data/puzzles.js';
import { PuzzleGenerator } from '../utils/puzzleGenerator.js';

export default function PuzzlesPage() {
  const [query, setQuery] = useState('');
  const [dynamicPuzzles, setDynamicPuzzles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const allPuzzles = useMemo(() => [...PUZZLES, ...dynamicPuzzles], [dynamicPuzzles]);

  const filteredPuzzles = useMemo(() => {
    return allPuzzles.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.difficulty.toLowerCase().includes(query.toLowerCase())
    );
  }, [allPuzzles, query]);

  const generateRandomPuzzle = async () => {
    setIsGenerating(true);
    const generator = new PuzzleGenerator();
    try {
      // Use a common tactical position as a seed for demonstration
      const seedFens = [
        "r1bq1rk1/ppp2ppp/2np1n2/4p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 1",
        "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 1 5"
      ];
      const randomFen = seedFens[Math.floor(Math.random() * seedFens.length)];
      
      const newPuzzle = await generator.generateFromFen(randomFen);
      if (newPuzzle) {
        setDynamicPuzzles(prev => [newPuzzle, ...prev]);
      } else {
        alert("No tactic found in current position analysis.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      generator.terminate();
      setIsGenerating(false);
    }
  };

  return (
    <div className="puzzles-page-container">
      <div className="page-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Puzzle Library</h1>
            <p>Sharpen your tactics with curated chess puzzles.</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={generateRandomPuzzle} 
            disabled={isGenerating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <HiRefresh className={isGenerating ? 'spin' : ''} />
            {isGenerating ? 'Analyzing...' : 'Generate Puzzle'}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <HiSearch size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search puzzles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search puzzles"
          />
        </div>
        <span className="filter-result-count">
          {filteredPuzzles.length} puzzle{filteredPuzzles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredPuzzles.length === 0 ? (
        <div className="card-placeholder" style={{ minHeight: 300 }}>
          <p>No puzzles found for "{query}"</p>
        </div>
      ) : (
        <div className="grid-4">
          {filteredPuzzles.map((puzzle) => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .puzzles-page-container { padding-bottom: 40px; }
        .grid-4 { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
          gap: 20px; 
          margin-top: 24px; 
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
