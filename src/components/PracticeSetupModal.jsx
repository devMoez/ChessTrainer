import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiAcademicCap, HiChip, HiSearch, HiSparkles, HiX } from 'react-icons/hi';
import MiniBoard from './MiniBoard.jsx';
import { OPENINGS } from '../data/openings.js';

function matchesOpening(opening, query) {
  if (!query) return true;

  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    opening.name,
    opening.eco,
    opening.color,
    opening.difficulty,
    opening.description,
    ...(opening.tags || []),
  ].join(' ').toLowerCase();

  return haystack.includes(normalized);
}

export default function PracticeSetupModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(OPENINGS[0]?.id ?? null);

  const filteredOpenings = useMemo(
    () => OPENINGS.filter((opening) => matchesOpening(opening, query)),
    [query]
  );

  const selectedOpening = useMemo(
    () => filteredOpenings.find((opening) => opening.id === selectedId) ?? filteredOpenings[0] ?? null,
    [filteredOpenings, selectedId]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  const launchEnginePractice = () => {
    if (!selectedOpening) return;

    navigate('/play/computer', {
      state: {
        opening: selectedOpening,
        practiceMode: 'engine',
      },
    });
    onClose?.();
  };

  const launchTwoSidedPractice = () => {
    if (!selectedOpening) return;

    navigate('/trainer', {
      state: {
        opening: selectedOpening,
        practiceMode: 'both-sides',
        returnTo: '/play',
      },
    });
    onClose?.();
  };

  return (
    <div
      className="practice-setup-backdrop"
      onClick={() => onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-setup-title"
    >
      <div className="practice-setup-modal" onClick={(event) => event.stopPropagation()}>
        <div className="practice-setup-header">
          <div>
            <p className="practice-setup-kicker">Practice Mode</p>
            <h2 id="practice-setup-title">Pick an opening to rehearse</h2>
            <p className="practice-setup-subtitle">
              Search the current opening library and launch either a guided trainer line or a live engine spar.
            </p>
          </div>
          <button
            className="practice-setup-close"
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close practice setup"
          >
            <HiX />
          </button>
        </div>

        <div className="practice-setup-search">
          <HiSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search openings, ECO codes, colors, or tags"
            aria-label="Search openings"
          />
        </div>

        <div className="practice-setup-body">
          <div className="practice-setup-results">
            {filteredOpenings.map((opening) => {
              const active = selectedOpening?.id === opening.id;

              return (
                <button
                  key={opening.id}
                  className={`practice-opening-card${active ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setSelectedId(opening.id)}
                >
                  <div className="practice-opening-board">
                    <MiniBoard fen={opening.fen} orientation={opening.color?.toLowerCase() === 'black' ? 'black' : 'white'} />
                  </div>
                  <div className="practice-opening-content">
                    <div className="practice-opening-meta">
                      <span>{opening.eco}</span>
                      <span>{opening.difficulty}</span>
                    </div>
                    <h3>{opening.name}</h3>
                    <p>{opening.description}</p>
                    <div className="practice-opening-tags">
                      {(opening.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}

            {!filteredOpenings.length ? (
              <div className="practice-empty-state">
                <HiSparkles />
                <p>No openings matched that search.</p>
              </div>
            ) : null}
          </div>

          <div className="practice-selection-panel">
            {selectedOpening ? (
              <>
                <div className="practice-selection-preview">
                  <MiniBoard
                    fen={selectedOpening.fen}
                    orientation={selectedOpening.color?.toLowerCase() === 'black' ? 'black' : 'white'}
                  />
                </div>
                <div className="practice-selection-copy">
                  <span className="practice-selection-pill">{selectedOpening.eco}</span>
                  <h3>{selectedOpening.name}</h3>
                  <p>{selectedOpening.description}</p>
                </div>
                <div className="practice-selection-stats">
                  <div>
                    <span>Repertoire</span>
                    <strong>{selectedOpening.color}</strong>
                  </div>
                  <div>
                    <span>Difficulty</span>
                    <strong>{selectedOpening.difficulty}</strong>
                  </div>
                  <div>
                    <span>Popularity</span>
                    <strong>{selectedOpening.popularity}%</strong>
                  </div>
                </div>
                <div className="practice-selection-actions">
                  <button className="btn btn-primary" type="button" onClick={launchEnginePractice}>
                    <HiChip /> Practice against Engine
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={launchTwoSidedPractice}>
                    <HiAcademicCap /> Play both sides
                  </button>
                </div>
              </>
            ) : (
              <div className="practice-empty-panel">
                <HiSparkles />
                <p>Select an opening to continue.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
