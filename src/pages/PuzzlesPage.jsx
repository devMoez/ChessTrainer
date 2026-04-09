import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PuzzleCard from '../components/PuzzleCard.jsx';
import { PUZZLES, PUZZLE_CATEGORIES, PUZZLE_DIFFICULTIES } from '../data/puzzles.js';
import puzzleCacheStore from '../stores/puzzleCache.js';
import { usePuzzleCache } from '../hooks/usePuzzleCache.js';
import PreviewBoard from '../components/PreviewBoard.jsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 250;

// Category chips — skip 'All' from PUZZLE_CATEGORIES since we handle it separately
const CATEGORY_FILTERS = PUZZLE_CATEGORIES; // already has 'All' first
const DIFFICULTY_FILTERS = PUZZLE_DIFFICULTIES; // already has 'All' first

const PuzzleModal = React.memo(function PuzzleModal({ puzzle, onClose, onPlay, boardTheme }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!puzzle) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="puzzle-modal-title"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', marginBottom: 4 }}>
              {puzzle.difficulty} · {puzzle.category}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }} id="puzzle-modal-title">
              {puzzle.category}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, padding: '2px 6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', flexShrink: 0, marginBottom: 16 }}>
          <PreviewBoard
            fen={puzzle.fen}
            lightColor={boardTheme.light}
            darkColor={boardTheme.dark}
          />
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
          {puzzle.description}
        </p>

        {puzzle.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {puzzle.tags.map((tag) => (
              <span key={tag} className="chip" style={{ fontSize: 11 }}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onPlay}
            type="button"
          >
            Solve Puzzle
          </button>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

const Pagination = React.memo(function Pagination({ displayPage, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - displayPage) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  }, [displayPage, totalPages]);

  return (
    <div className="pagination" role="navigation" aria-label="Page navigation">
      <button
        className="page-btn"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={displayPage === 1}
        aria-label="Previous page"
        type="button"
      >
        <ChevronLeft size={16} />
      </button>
      {pageNumbers.map((item, idx) =>
        item === '...'
          ? <span key={`e-${idx}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
          : (
            <button
              key={item}
              className={`page-btn${displayPage === item ? ' active' : ''}`}
              onClick={() => setPage(item)}
              aria-label={`Page ${item}`}
              aria-current={displayPage === item ? 'page' : undefined}
              type="button"
            >
              {item}
            </button>
          )
      )}
      <button
        className="page-btn"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={displayPage === totalPages}
        aria-label="Next page"
        type="button"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

export default function PuzzlesPage() {
  const navigate = useNavigate();
  const { boardTheme } = useApp();
  const { isReady } = usePuzzleCache();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  useEffect(() => {
    puzzleCacheStore.preloadPuzzles(PUZZLES);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedQuery, category, difficulty]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return PUZZLES.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (q) {
        return (
          p.category.toLowerCase().includes(q) ||
          p.difficulty.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [debouncedQuery, category, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE),
    [activePage, filtered]
  );

  const handleCardClick = useCallback((puzzle) => {
    setSelectedPuzzle(puzzle);
  }, []);

  const handlePlay = useCallback(() => {
    if (selectedPuzzle) {
      navigate('/puzzle', { state: { puzzle: selectedPuzzle } });
    }
  }, [navigate, selectedPuzzle]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return (
    <div>
      <div className="page-heading">
        <h1>Puzzle Library</h1>
        <p>Master tactics with verified chess positions.</p>
      </div>

      {/* Filter bar — matches openings style */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search by theme, difficulty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search puzzles"
          />
          {query ? (
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label="Clear search" type="button">
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="chip-group">
          {DIFFICULTY_FILTERS.map((d) => (
            <button
              key={d}
              className={`chip${difficulty === d ? ' active' : ''}`}
              onClick={() => setDifficulty(d)}
              type="button"
            >
              {d}
            </button>
          ))}
        </div>

        <div className="chip-group">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              className={`chip${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        <span className="filter-result-count">
          {filtered.length} puzzle{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-placeholder" style={{ minHeight: 300 }}>
          <p>No puzzles match your filters.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setCategory('All'); setDifficulty('All'); }} type="button">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid-4">
          {paginated.map((puzzle) => (
            <PuzzleCard
              key={puzzle.id}
              puzzle={puzzle}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <Pagination displayPage={activePage} totalPages={totalPages} setPage={setPage} />

      {selectedPuzzle && (
        <PuzzleModal
          puzzle={selectedPuzzle}
          boardTheme={boardTheme}
          onClose={() => setSelectedPuzzle(null)}
          onPlay={handlePlay}
        />
      )}
    </div>
  );
}
