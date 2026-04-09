import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import {
  Play,
  Search,
  Star,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import OpeningCard from '../components/OpeningCard.jsx';
import MiniBoard from '../components/MiniBoard.jsx';
import { filterOpenings } from '../data/openings.js';
import { useCachedOpenings, getAllCachedOpenings } from '../hooks/useCacheInitializer.js';
import { useApp } from '../context/AppContext.jsx';

// Memoized StudyModal to prevent re-renders when parent state changes
const StudyModal = React.memo(function StudyModal({ opening, onClose, onPlay, boardTheme }) {
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

  if (!opening) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
      id="study-modal"
    >
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: 520, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', marginBottom: 4 }}>
              {opening.eco} / {opening.color} / {opening.difficulty}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }} id="study-modal-title">
              {opening.name}
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

        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 12,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: 20
        }}>
          <Chessboard
            id={`study-board-${opening.id}`}
            position={opening.previewFEN || 'start'}
            boardOrientation={opening.color?.toLowerCase() === 'black' ? 'black' : 'white'}
            arePiecesDraggable={false}
            showBoardNotation={false}
            animationDuration={0}
            customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
            customLightSquareStyle={{ backgroundColor: boardTheme.light }}
            boardStyle={{
              border: "none",
              boxShadow: "none"
            }}
          />
        </div>

        <div style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 14,
          color: 'var(--accent-gold)',
          background: 'transparent',
          borderRadius: 8,
          padding: '10px 14px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          marginBottom: 20
        }}>
          {opening.moves}
        </div>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 20px 0'
        }}>
          {opening.description}
        </p>

        <div style={{ display: 'flex', gap: 24, padding: '4px 0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <TrendingUp style={{ color: 'var(--accent-green)', fontSize: 16 }} />
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{opening.winRate}%</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>win rate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Star style={{ color: 'var(--accent-gold)', fontSize: 16 }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{opening.popularity}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>popularity</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {opening.tags?.map((tag) => (
            <span key={tag} className="chip active" style={{ fontSize: 11 }}>{tag}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onPlay}
            id="study-modal-play-btn"
            type="button"
          >
            <Play size={18} /> Play this Opening
          </button>
          <button className="btn btn-ghost" onClick={onClose} id="study-modal-close-btn" type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

const DIFFICULTY_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const COLOR_FILTERS = ['All', 'White', 'Black'];
const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 250;
const CARD_HIGHLIGHT_MS = 1800;

// Separate FilterBar component to reduce OpeningsPage complexity and re-renders
const FilterBar = React.memo(function FilterBar({ 
  query, 
  handleQueryChange, 
  clearSearch, 
  difficulty, 
  handleDifficultyChange, 
  colorFilter, 
  handleColorChange, 
  resultsCount 
}) {
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="search"
          placeholder="Search openings..."
          value={query}
          onChange={handleQueryChange}
          aria-label="Search openings"
          id="openings-search-input"
        />
        {query ? (
          <button
            onClick={clearSearch}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
            aria-label="Clear search"
            type="button"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="chip-group">
        {DIFFICULTY_FILTERS.map((filterLabel) => (
          <button
            key={filterLabel}
            className={`chip${difficulty === filterLabel ? ' active' : ''}`}
            onClick={() => handleDifficultyChange(filterLabel)}
            id={`filter-difficulty-${filterLabel.toLowerCase()}`}
            type="button"
          >
            {filterLabel}
          </button>
        ))}
      </div>

      <div className="chip-group">
        {COLOR_FILTERS.map((filterLabel) => (
          <button
            key={filterLabel}
            className={`chip${colorFilter === filterLabel ? ' active' : ''}`}
            onClick={() => handleColorChange(filterLabel)}
            id={`filter-color-${filterLabel.toLowerCase()}`}
            type="button"
          >
            {filterLabel}
          </button>
        ))}
      </div>

      <span className="filter-result-count">
        {resultsCount} opening{resultsCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
});

// Separate Pagination component
const Pagination = React.memo(function Pagination({ 
  displayPage, 
  totalPages, 
  setPage, 
  pageNumbers 
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination" role="navigation" aria-label="Page navigation">
      <button
        className="page-btn"
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        disabled={displayPage === 1}
        aria-label="Previous page"
        id="pagination-prev"
        type="button"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers.map((item, index) => (
        item === '...'
          ? <span key={`ellipsis-${index}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
          : (
            <button
              key={item}
              className={`page-btn${displayPage === item ? ' active' : ''}`}
              onClick={() => setPage(item)}
              aria-label={`Page ${item}`}
              aria-current={displayPage === item ? 'page' : undefined}
              id={`pagination-page-${item}`}
              type="button"
            >
              {item}
            </button>
          )
      ))}

      <button
        className="page-btn"
        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        disabled={displayPage === totalPages}
        aria-label="Next page"
        id="pagination-next"
        type="button"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

export default function OpeningsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { boardTheme } = useApp();

  const { openings: cachedOpenings } = useCachedOpenings();

  const query = searchParams.get('q') || '';
  const focusOpeningId = location.state?.focusOpeningId ?? null;
  const focusKey = focusOpeningId
    ? `${focusOpeningId}:${location.state?.focusNonce ?? location.key}`
    : '';

  const highlightTimeoutRef = useRef(0);
  const lastHighlightKeyRef = useRef('');

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const difficulty = searchParams.get('level') || 'All';
  const colorFilter = searchParams.get('color') || 'All';
  const [page, setPage] = useState(1);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [highlightedOpeningId, setHighlightedOpeningId] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => () => window.clearTimeout(highlightTimeoutRef.current), []);

  const searchedOpenings = useMemo(
    () => filterOpenings(debouncedQuery, cachedOpenings),
    [debouncedQuery, cachedOpenings]
  );

  const filtered = useMemo(() => {
    if (!searchedOpenings) return [];
    return searchedOpenings.filter((opening) => {
      if (!opening) return false;
      const matchesDifficulty = difficulty === 'All' || opening.difficulty === difficulty;
      const matchesColor = colorFilter === 'All' || opening.color === colorFilter;
      return matchesDifficulty && matchesColor;
    });
  }, [colorFilter, difficulty, searchedOpenings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const focusIndex = focusOpeningId
    ? filtered.findIndex((opening) => opening?.id === focusOpeningId)
    : -1;
  const focusPage = focusIndex === -1 ? null : Math.floor(focusIndex / PAGE_SIZE) + 1;
  const pendingFocus = Boolean(focusOpeningId && lastHighlightKeyRef.current !== focusKey);
  const displayPage = pendingFocus && focusPage ? focusPage : activePage;

  const paginated = useMemo(
    () => filtered.slice((displayPage - 1) * PAGE_SIZE, displayPage * PAGE_SIZE),
    [displayPage, filtered]
  );

  useEffect(() => {
    if (!focusOpeningId || !focusPage || lastHighlightKeyRef.current === focusKey) return;

    const timeoutId = window.setTimeout(() => {
      if (page !== focusPage) {
        setPage(focusPage);
      }

      const targetCard = document.getElementById(`opening-card-${focusOpeningId}`);
      if (!targetCard) return;

      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      setHighlightedOpeningId(focusOpeningId);
      lastHighlightKeyRef.current = focusKey;

      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedOpeningId((current) => (
          current === focusOpeningId ? null : current
        ));
      }, CARD_HIGHLIGHT_MS);
    }, 90);

    return () => window.clearTimeout(timeoutId);
  }, [focusKey, focusOpeningId, focusPage, page]);

  const studyOpening = useMemo(() => {
    if (pendingFocus) return null;
    if (selectedOpening) return selectedOpening;
    const studyId = searchParams.get('study');
    const cachedOpenings = getAllCachedOpenings();
    return studyId ? (cachedOpenings.find((opening) => opening?.id === studyId) ?? null) : null;
  }, [pendingFocus, searchParams, selectedOpening]);

  function updateSearchParam({ q, level, color, study } = {}) {
    const nextParams = new URLSearchParams(searchParams);

    if (q !== undefined) {
      const trimmed = `${q ?? ''}`.trim();
      if (trimmed) nextParams.set('q', trimmed);
      else nextParams.delete('q');
    }

    if (level !== undefined) {
      if (level && level !== 'All') nextParams.set('level', level);
      else nextParams.delete('level');
    }

    if (color !== undefined) {
      if (color && color !== 'All') nextParams.set('color', color);
      else nextParams.delete('color');
    }

    if (study !== undefined) {
      if (study) nextParams.set('study', study);
      else nextParams.delete('study');
    }

    setSearchParams(nextParams);
  }

  const handleQueryChange = useCallback((event) => {
    updateSearchParam({ q: event.target.value });
    setPage(1);
  }, [searchParams]);

  const handleDifficultyChange = useCallback((nextDifficulty) => {
    updateSearchParam({ level: nextDifficulty });
    setPage(1);
  }, [searchParams]);

  const handleColorChange = useCallback((nextColor) => {
    updateSearchParam({ color: nextColor });
    setPage(1);
  }, [searchParams]);

  const handleCardClick = useCallback((opening) => {
    setSelectedOpening(opening);
    updateSearchParam({ study: opening.id });
  }, [searchParams]);

  const handleCloseStudy = useCallback(() => {
    setSelectedOpening(null);
    updateSearchParam({ study: null });
  }, [searchParams]);

  const handleClearFilters = useCallback(() => {
    setPage(1);
    setHighlightedOpeningId(null);
    setSelectedOpening(null);
    setSearchParams({});
  }, [setSearchParams]);

  const clearSearch = useCallback(() => {
    updateSearchParam({ q: '' });
    setPage(1);
  }, [searchParams]);

  const pageNumbersList = useMemo(() => {
    const nums = [];
    for (let index = 1; index <= totalPages; index += 1) {
      if (index === 1 || index === totalPages || (index >= displayPage - 1 && index <= displayPage + 1)) {
        nums.push(index);
      } else if (nums[nums.length - 1] !== '...') {
        nums.push('...');
      }
    }
    return nums;
  }, [totalPages, displayPage]);

  return (
    <div>
      {studyOpening ? (
        <StudyModal
          opening={studyOpening}
          onClose={handleCloseStudy}
          onPlay={() => navigate('/trainer', { state: { opening: studyOpening } })}
          boardTheme={boardTheme}
        />
      ) : null}

      <div className="page-heading">
        <h1>Opening Library</h1>
        <p>Explore and study chess openings for every level and style.</p>
      </div>

      <FilterBar 
        query={query}
        handleQueryChange={handleQueryChange}
        clearSearch={clearSearch}
        difficulty={difficulty}
        handleDifficultyChange={handleDifficultyChange}
        colorFilter={colorFilter}
        handleColorChange={handleColorChange}
        resultsCount={filtered.length}
      />

      {paginated.length === 0 ? (
        <div className="card-placeholder" style={{ minHeight: 300 }}>
          <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
          <p>No openings found for "{debouncedQuery || query}"</p>
          <button className="btn btn-ghost btn-sm" onClick={handleClearFilters} type="button">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid-4">
          {paginated.map((opening) => (
            <OpeningCard
              key={opening.id}
              opening={opening}
              onClick={handleCardClick}
              highlighted={highlightedOpeningId === opening.id}
            />
          ))}
        </div>
      )}

      <Pagination 
        displayPage={displayPage}
        totalPages={totalPages}
        setPage={setPage}
        pageNumbers={pageNumbersList}
      />
    </div>
  );
}
