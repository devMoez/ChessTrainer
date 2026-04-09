import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniBoard from '../components/MiniBoard.jsx';
import { useCachedOpenings } from '../hooks/useCacheInitializer.js';
import { useApp } from '../context/AppContext.jsx';

function difficultyBadgeStyle(d) {
  if (d === 'Beginner')     return { background: 'rgba(76, 175, 80, 0.85)',  color: 'var(--text-on-success)' };
  if (d === 'Intermediate') return { background: 'rgba(255, 167, 38, 0.85)', color: 'var(--text-on-gold)' };
  return                           { background: 'rgba(229, 57, 53, 0.85)',   color: 'var(--text-on-success)' };
}

function HomeOpeningCard({ opening, onClick, boardTheme }) {
  return (
    <article
      onClick={() => onClick && onClick(opening)}
      id={`home-card-${opening.id}`}
      className="home-opening-card"
    >
      {/* Card Header: name + badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 10px',
      }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        }}>
          {opening.name}
        </span>
        <span style={{
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          ...difficultyBadgeStyle(opening.difficulty),
        }}>
          {opening.difficulty}
        </span>
      </div>

      {/* Mini Board */}
      <div style={{
        width: '100%',
        overflow: 'hidden',
      }}>
        <MiniBoard
          fen={opening.previewFEN || opening.fen}
          lightColor={boardTheme.light}
          darkColor={boardTheme.dark}
        />
      </div>

      {/* Card Footer */}
      <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {opening.description}
        </p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { boardTheme } = useApp();

  // Get cached openings with correct FENs - use hook to subscribe to updates
  const { openings: cachedOpenings, isReady } = useCachedOpenings();
  
  const HOME_OPENING_IDS = [
    'italian-game', 'sicilian-dragon', 'queens-gambit-declined',
    'kings-indian-attack', 'ruy-lopez-main', 'french-winawer',
  ];
  
  const HOME_OPENINGS = useMemo(() => {
    if (!isReady || cachedOpenings.length === 0) return [];
    return HOME_OPENING_IDS
      .map(id => cachedOpenings.find(o => o.id === id))
      .filter(Boolean);
  }, [cachedOpenings, isReady]);

  /* ZERO-FLASH LAYOUT LOGIC */
  const [layoutReady, setLayoutReady] = useState(false);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // Sync with browser paint to ensure no flash
    setLayoutReady(true);
  }, []);

  function handleCardClick(opening) {
    navigate(`/openings?study=${opening.id}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: '60px 24px 48px' }}>
        <h1 style={{
          fontSize: '52px',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}>
          Train smarter. Master your openings.
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Improve your chess game with our comprehensive opening trainer. Learn,
          practice, and master the most important chess openings.
        </p>
      </section>

      {/* ── POPULAR OPENINGS ── */}
      <section style={{ padding: '0 0 32px' }}>
        {/* Section header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              Popular Openings
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--accent-gold)', margin: 0 }}>
              Start learning these essential chess openings
            </p>
          </div>
        </div>

        {/* 3-column grid */}
        <div 
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginTop: '24px',
            // Key to zero flash: invisible until layout calculation in useLayoutEffect
            visibility: layoutReady ? 'visible' : 'hidden',
            opacity: layoutReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in',
            minHeight: '400px'
          }}
        >
          {!isReady || HOME_OPENINGS.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading openings...
            </div>
          ) : (
            HOME_OPENINGS.map(opening => (
              <HomeOpeningCard
                key={opening.id}
                opening={opening}
                onClick={handleCardClick}
                boardTheme={boardTheme}
              />
            ))
          )}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '56px 24px',
        textAlign: 'center',
        margin: '16px 0 32px',
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '10px',
        }}>
          Ready to improve your game?
        </h2>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          marginBottom: '28px',
        }}>
          Explore our full library of openings and start training today.
        </p>
        <button
          id="browse-all-openings-btn"
          className="home-cta-btn"
          onClick={() => navigate('/openings')}
        >
          Browse All Openings
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 0',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        © 2026 Chess Trainer. All rights reserved.
      </footer>
    </div>
  );
}
