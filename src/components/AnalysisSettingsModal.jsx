import React, { useEffect, useState } from 'react';
import { HiX } from 'react-icons/hi';

export default function AnalysisSettingsModal({
  open = false,
  onClose,
  autoAnalyze,
  onAutoAnalyzeChange,
  showBestMoveArrow,
  onShowBestMoveArrowChange,
  showTopMoves,
  onShowTopMovesChange,
  humanizeMoves,
  onHumanizeMovesChange,
  humanizeElo,
  onHumanizeEloChange,
  thinkingTime,
  onThinkingTimeChange,
}) {
  const [eloInput, setEloInput] = useState(String(humanizeElo ?? ''));

  useEffect(() => {
    if (open) setEloInput(String(humanizeElo ?? ''));
  }, [open, humanizeElo]);

  const commitElo = () => {
    const trimmed = `${eloInput}`.trim();
    if (!trimmed) {
      setEloInput(String(humanizeElo ?? ''));
      return;
    }

    const nextValue = Number(trimmed);
    if (!Number.isFinite(nextValue)) {
      setEloInput(String(humanizeElo ?? ''));
      return;
    }

    onHumanizeEloChange?.(nextValue);
  };

  const handleClose = () => {
    commitElo();
    onClose?.();
  };

  useEffect(() => {
    if (!open) return undefined;

    const commitFromEffect = () => {
      const trimmed = `${eloInput}`.trim();
      if (!trimmed) {
        onClose?.();
        return;
      }

      const nextValue = Number(trimmed);
      if (Number.isFinite(nextValue)) {
        onHumanizeEloChange?.(nextValue);
      }

      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') commitFromEffect();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [eloInput, onClose, onHumanizeEloChange, open]);

  if (!open) return null;

  return (
    <div
      className="analysis-settings-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-settings-title"
    >
      <div
        className="analysis-settings-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="analysis-settings-header">
          <div>
            <p className="analysis-settings-kicker">Analysis</p>
            <h2 className="analysis-settings-title" id="analysis-settings-title">Board & engine</h2>
            <p className="analysis-settings-subtitle">
              Toggles and timing follow your app theme and the analysis workspace palette.
            </p>
          </div>

          <button
            className="analysis-settings-close"
            onClick={handleClose}
            type="button"
            aria-label="Close analysis settings"
          >
            <HiX aria-hidden />
          </button>
        </div>

        <div className="analysis-settings-body">
          <section className="analysis-settings-section" aria-labelledby="analysis-settings-sec-display">
            <h3 className="analysis-settings-section-title" id="analysis-settings-sec-display">
              Display
            </h3>
            <div className="analysis-settings-list">
              <label className="analysis-settings-row check-label">
                <input
                  type="checkbox"
                  checked={autoAnalyze}
                  onChange={(event) => onAutoAnalyzeChange?.(event.target.checked)}
                />
                <span className="check-custom" />
                Auto analyze after every move
              </label>

              <label className="analysis-settings-row check-label">
                <input
                  type="checkbox"
                  checked={showBestMoveArrow}
                  onChange={(event) => onShowBestMoveArrowChange?.(event.target.checked)}
                />
                <span className="check-custom" />
                Show best move arrow
              </label>

              <label className="analysis-settings-row check-label">
                <input
                  type="checkbox"
                  checked={showTopMoves}
                  onChange={(event) => onShowTopMovesChange?.(event.target.checked)}
                />
                <span className="check-custom" />
                Show top 5 moves
              </label>
            </div>
          </section>

          <section className="analysis-settings-section" aria-labelledby="analysis-settings-sec-human">
            <h3 className="analysis-settings-section-title" id="analysis-settings-sec-human">
              Humanization
            </h3>
            <div className="analysis-settings-list">
              <label className="analysis-settings-row check-label">
                <input
                  type="checkbox"
                  checked={humanizeMoves}
                  onChange={(event) => onHumanizeMovesChange?.(event.target.checked)}
                />
                <span className="check-custom" />
                Humanize engine lines
              </label>

              <div className="analysis-settings-field-row">
                <label className="analysis-settings-field-label" htmlFor="analysis-humanize-elo">
                  Target strength (Elo)
                </label>
                <input
                  id="analysis-humanize-elo"
                  className="analysis-settings-input"
                  type="number"
                  min="600"
                  max="2600"
                  step="1"
                  value={eloInput}
                  onChange={(event) => setEloInput(event.target.value)}
                  onBlur={commitElo}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      commitElo();
                    }
                  }}
                />
              </div>
            </div>
          </section>

          <section className="analysis-settings-section" aria-labelledby="analysis-settings-sec-engine">
            <h3 className="analysis-settings-section-title" id="analysis-settings-sec-engine">
              Engine
            </h3>
            <div className="analysis-settings-think">
              <div className="analysis-settings-field-row analysis-settings-field-row-split">
                <label className="analysis-settings-field-label" htmlFor="analysis-think-time">
                  Think time (seconds)
                </label>
                <input
                  id="analysis-think-time"
                  className="analysis-settings-input analysis-settings-input-narrow"
                  type="number"
                  min="1"
                  max="60"
                  value={thinkingTime}
                  onChange={(event) => onThinkingTimeChange?.(Number(event.target.value))}
                />
              </div>

              <input
                className="analysis-settings-range"
                type="range"
                min="1"
                max="60"
                value={thinkingTime}
                onChange={(event) => onThinkingTimeChange?.(Number(event.target.value))}
                aria-label="Engine think time"
              />
            </div>
          </section>
        </div>

        <div className="analysis-settings-actions">
          <button className="btn btn-primary" onClick={handleClose} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
