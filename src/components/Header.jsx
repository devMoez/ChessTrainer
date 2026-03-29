import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { filterOpenings } from '../data/openings.js';
import {
  HiHome,
  HiMoon,
  HiSearch,
  HiSun,
  HiX,
} from 'react-icons/hi';

const MAX_HEADER_RESULTS = 6;

export default function Header() {
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim();
  const results = useMemo(
    () => (trimmedQuery ? filterOpenings(trimmedQuery).slice(0, MAX_HEADER_RESULTS) : []),
    [trimmedQuery]
  );

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const handlePointerDown = (event) => {
      if (searchWrapRef.current?.contains(event.target)) return;
      setIsSearchOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const openSearch = () => {
    setIsSearchOpen(true);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      closeSearch();
      return;
    }

    openSearch();
  };

  const handleNavigateToResult = (opening) => {
    const nextSearch = trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : '';
    navigate(
      {
        pathname: '/openings',
        search: nextSearch,
      },
      {
        state: {
          focusOpeningId: opening.id,
          focusNonce: Date.now(),
        },
      }
    );
    closeSearch();
  };

  const handleSearchSubmit = () => {
    if (results[0]) {
      handleNavigateToResult(results[0]);
      return;
    }

    navigate({
      pathname: '/openings',
      search: trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : '',
    });
    closeSearch();
  };

  return (
    <header className="header">
      <div className="header-tools">
        <div
          ref={searchWrapRef}
          className={`header-search-shell${isSearchOpen ? ' is-open' : ''}`}
        >
          <div className="header-search" aria-hidden={!isSearchOpen}>
            <HiSearch />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search openings..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              aria-label="Search openings"
            />

            {query ? (
              <button
                className="header-search-clear"
                type="button"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear header search"
              >
                <HiX />
              </button>
            ) : null}
          </div>

          {isSearchOpen && trimmedQuery ? (
            <div className="header-search-dropdown" role="listbox" aria-label="Opening suggestions">
              {results.length ? (
                results.map((opening) => (
                  <button
                    key={opening.id}
                    className="header-search-result"
                    type="button"
                    onClick={() => handleNavigateToResult(opening)}
                  >
                    <span className="header-search-result-main">
                      <span className="header-search-result-title">{opening.name}</span>
                      <span className="header-search-result-meta">
                        {opening.eco} / {opening.difficulty}
                      </span>
                    </span>
                    <span className="header-search-result-side">{opening.color}</span>
                  </button>
                ))
              ) : (
                <div className="header-search-empty">No openings found</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          <button
            className={`header-icon-btn${isSearchOpen ? ' active' : ''}`}
            onClick={handleSearchToggle}
            title="Search"
            aria-label="Search"
            type="button"
          >
            <HiSearch />
          </button>

          <button
            className="header-icon-btn"
            onClick={() => navigate('/')}
            title="Home"
            aria-label="Go to home"
            type="button"
          >
            <HiHome />
          </button>

          <div
            className="header-avatar"
            title="User profile"
            role="button"
            aria-label="User profile"
            onClick={() => navigate('/profile')}
          >
            CT
          </div>

          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === 'dark' ? <HiSun /> : <HiMoon />}
          </button>
        </div>
      </div>
    </header>
  );
}
