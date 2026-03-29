import React from 'react';
import { HiInformationCircle } from 'react-icons/hi';
import { useApp, BOARD_THEMES } from '../context/AppContext.jsx';

const PIECE_STYLES = ['2D', '3D', 'Classic'];

export default function SettingsPage() {
  const {
    showLegalDots, setShowLegalDots,
    showThreats, setShowThreats,
    showEvalBar, setShowEvalBar,
    autoEnPassant, setAutoEnPassant,
    pieceStyle, setPieceStyle,
    boardTheme, setBoardTheme,
    theme, toggleTheme,
  } = useApp();

  return (
    <div className="settings-page">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>Customize your board, pieces, and display preferences.</p>
      </div>

      <section className="settings-section" aria-labelledby="board-settings-title">
        <div className="settings-section-title" id="board-settings-title">Board Appearance</div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Piece Style</div>
            <div className="settings-row-desc">Choose the visual style for chess pieces.</div>
          </div>
          <div className="chip-group">
            {PIECE_STYLES.map(style => (
              <button
                key={style}
                className={`chip${pieceStyle === style ? ' active' : ''}`}
                onClick={() => setPieceStyle(style)}
                id={`piece-style-${style.toLowerCase()}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <div>
            <div className="settings-row-label">Board Theme</div>
            <div className="settings-row-desc">Select the color scheme for the chess board.</div>
          </div>
          <div className="board-theme-presets">
            {BOARD_THEMES.map(themeOption => (
              <button
                key={themeOption.id}
                className={`board-theme-swatch${boardTheme.id === themeOption.id ? ' active' : ''}`}
                onClick={() => setBoardTheme(themeOption)}
                title={themeOption.name}
                aria-label={`${themeOption.name} board theme${boardTheme.id === themeOption.id ? ' (selected)' : ''}`}
                id={`board-theme-${themeOption.id}`}
              >
                <div className="swatch-tile" style={{ background: themeOption.light }} />
                <div className="swatch-tile" style={{ background: themeOption.dark }} />
                <div className="swatch-tile" style={{ background: themeOption.dark }} />
                <div className="swatch-tile" style={{ background: themeOption.light }} />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Selected: <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{boardTheme.name}</span>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="display-settings-title">
        <div className="settings-section-title" id="display-settings-title">Display Options</div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Legal Move Dots</div>
            <div className="settings-row-desc">Show move indicators on squares a selected piece can reach.</div>
          </div>
          <ToggleSwitch
            checked={showLegalDots}
            onChange={() => setShowLegalDots(value => !value)}
            id="toggle-legal-dots"
            aria-label="Toggle legal move dots"
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Threat Highlights</div>
            <div className="settings-row-desc">Highlight dangerous attacking squares around the active king.</div>
          </div>
          <ToggleSwitch
            checked={showThreats}
            onChange={() => setShowThreats(value => !value)}
            id="toggle-threats"
            aria-label="Toggle threat highlights"
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Evaluation Bar</div>
            <div className="settings-row-desc">Show the Stockfish evaluation bar next to the analysis board.</div>
          </div>
          <ToggleSwitch
            checked={showEvalBar}
            onChange={() => setShowEvalBar(value => !value)}
            id="toggle-eval-bar"
            aria-label="Toggle evaluation bar"
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Automatic En Passant</div>
            <div className="settings-row-desc">Keep en passant targets active automatically after legal pawn double-steps.</div>
          </div>
          <ToggleSwitch
            checked={autoEnPassant}
            onChange={() => setAutoEnPassant(value => !value)}
            id="toggle-auto-en-passant"
            aria-label="Toggle automatic en passant"
          />
        </div>

        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Global Consistency
                <span
                  style={{
                    background: 'var(--accent-gold-10)',
                    color: 'var(--accent-gold)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 10,
                    letterSpacing: '0.06em',
                  }}
                >
                  LOCKED ON
                </span>
              </div>
              <div className="settings-row-desc">Settings apply consistently across all boards and modes.</div>
            </div>
          </div>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'help',
              fontSize: 20,
              display: 'flex',
              padding: 4,
            }}
            title="Global Consistency: Your display settings are always applied everywhere in the app, ensuring consistent behavior across training, play, and analysis."
            aria-label="Global consistency info"
            id="global-consistency-info"
          >
            <HiInformationCircle />
          </button>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="theme-settings-title">
        <div className="settings-section-title" id="theme-settings-title">Interface</div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Dark Mode</div>
            <div className="settings-row-desc">Toggle between dark and light interface themes.</div>
          </div>
          <ToggleSwitch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            id="toggle-dark-mode"
            aria-label="Toggle dark mode"
          />
        </div>
      </section>

      <section className="settings-section" style={{ background: 'none', border: '1px dashed var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-gold)' }}>
            CH
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Chess Trainer v1.0
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Powered by <span style={{ color: 'var(--accent-gold)' }}>Stockfish 18.0.5</span> - React + Vite
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, id, ...rest }) {
  return (
    <label className="toggle" htmlFor={id} style={{ cursor: 'pointer' }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        {...rest}
      />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  );
}
