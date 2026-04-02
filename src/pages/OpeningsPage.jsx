import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import {
  HiPlay,
  HiSearch,
  HiStar,
  HiTrendingUp,
  HiX,
} from 'react-icons/hi';
import OpeningCard from '../components/OpeningCard.jsx';
import MiniBoard from '../components/MiniBoard.jsx';
import { filterOpenings, OPENINGS } from '../data/openings.js';
import { useApp } from '../context/AppContext.jsx';

const DIFFICULTY_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const COLOR_FILTERS = ['All', 'White', 'Black'];
const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 250;
const CARD_HIGHLIGHT_MS = 1800;

export default function OpeningsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { boardTheme } = useApp();

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

  // ZERO-FLASH LAYOUT LOGIC
  const [layoutReady, setLayoutReady] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => () => window.clearTimeout(highlightTimeoutRef.current), []);

  const searchedOpenings = useMemo(
    () => filterOpenings(debouncedQuery),
    [debouncedQuery]
  );

  const filtered = useMemo(() => searchedOpenings.filter((opening) => {
    const matchesDifficulty = difficulty === 'All' || opening.difficulty === difficulty;
    const matchesColor = colorFilter === 'All' || opening.color === colorFilter;
    return matchesDifficulty && matchesColor;
  }), [colorFilter, difficulty, searchedOpenings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const focusIndex = focusOpeningId
    ? filtered.findIndex((opening) => opening.id === focusOpeningId)
    : -1;
  const focusPage = focusIndex === -1 ? null : Math.floor(focusIndex / PAGE_SIZE) + 1;
  const pendingFocus = Boolean(focusOpeningId && lastHighlightKeyRef.current !== focusKey);
  const displayPage = pendingFocus && focusPage ? focusPage : activePage;

  const paginated = useMemo(
    () => filtered.slice((displayPage - 1) * PAGE_SIZE, displayPage * PAGE_SIZE),
    [displayPage, filtered]
  );

  // useLayoutEffect runs SYNCHRONOUSLY before paint
  useLayoutEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;
      setLayoutReady(true);
    };
    updateLayout();
  }, [paginated, debouncedQuery, difficulty, colorFilter]);

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
    return studyId ? (OPENINGS.find((opening) => opening.id === studyId) ?? null) : null;
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

  function handleQueryChange(event) {
    updateSearchParam({ q: event.target.value });
    setPage(1);
  }

  function handleDifficultyChange(nextDifficulty) {
    updateSearchParam({ level: nextDifficulty });
    setPage(1);
  }

  function handleColorChange(nextColor) {
    updateSearchParam({ color: nextColor });
    setPage(1);
  }

  function handleCardClick(opening) {
    setSelectedOpening(opening);
    updateSearchParam({ study: opening.id });
  }

  function handleCloseStudy() {
    setSelectedOpening(null);
    updateSearchParam({ study: null });
  }

  function handleClearFilters() {
    setPage(1);
    setHighlightedOpeningId(null);
    setSelectedOpening(null);
    setSearchParams({});
  }

  function pageNumbers() {
    const nums = [];
    for (let index = 1; index <= totalPages; index += 1) {
      if (index === 1 || index === totalPages || (index >= displayPage - 1 && index <= displayPage + 1)) {
        nums.push(index);
      } else if (nums[nums.length - 1] !== '...') {
        nums.push('...');
      }
    }
    return nums;
  }

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

      <div className="filter-bar">
        <div className="filter-search">
          <HiSearch size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
              onClick={() => {
                updateSearchParam({ q: '' });
                setPage(1);
              }}
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
              <HiX size={14} />
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
          {filtered.length} opening{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {paginated.length === 0 ? (
        <div className="card-placeholder" style={{ minHeight: 300 }}>
          <span className="placeholder-icon">Search</span>
          <p>No openings found for "{debouncedQuery || query}"</p>
          <button className="btn btn-ghost btn-sm" onClick={handleClearFilters} type="button">
            Clear filters
          </button>
        </div>
      ) : (
        <div
          className="grid-4"
          ref={containerRef}
          style={{
            // Key to zero flash: invisible until layout calculation in useLayoutEffect
            visibility: layoutReady ? 'visible' : 'hidden',
            opacity: layoutReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in',
            // Pre-calculate min-height to prevent layout shift below the grid
            minHeight: '600px',
            willChange: 'opacity'
          }}
        >
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

      {totalPages > 1 ? (
        <div className="pagination" role="navigation" aria-label="Page navigation">
          <button
            className="page-btn"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={displayPage === 1}
            aria-label="Previous page"
            id="pagination-prev"
            type="button"
          >
            {'<'}
          </button>

          {pageNumbers().map((item, index) => (
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
            {'>'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StudyModal({ opening, onClose, onPlay, boardTheme }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
        style={{ maxWidth: 520, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
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
            x
          </button>
        </div>

        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <Chessboard
            id={`study-board-${opening.id}`}
            position={opening.fen}
            boardOrientation={opening.color?.toLowerCase() === 'black' ? 'black' : 'white'}
            arePiecesDraggable={false}
            showBoardNotation={false}
            animationDuration={0}
            customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
            customLightSquareStyle={{ backgroundColor: boardTheme.light }}
          />
        </div>

        <div style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 14,
          color: 'var(--accent-gold)',
          background: 'var(--accent-gold-10)',
          borderRadius: 8,
          padding: '10px 14px',
          border: '1px solid var(--accent-gold-20)',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {opening.moves}
        </div>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0
        }}>
          {opening.description}
        </p>

        <div style={{ display: 'flex', gap: 24, padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <HiTrendingUp style={{ color: 'var(--accent-green)', fontSize: 16 }} />
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{opening.winRate}%</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>win rate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <HiStar style={{ color: 'var(--accent-gold)', fontSize: 16 }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{opening.popularity}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>popularity</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {opening.tags.map((tag) => (
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
            <HiPlay /> Play this Opening
          </button>
          <button className="btn btn-ghost" onClick={onClose} id="study-modal-close-btn" type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
