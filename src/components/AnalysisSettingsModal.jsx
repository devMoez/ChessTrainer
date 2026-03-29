import React, { useEffect, useState } from 'react';

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
            <p className="analysis-settings-kicker">Engine settings</p>
            <h2 className="analysis-settings-title" id="analysis-settings-title">Analysis options</h2>
          </div>

          <button
            className="analysis-settings-close"
            onClick={handleClose}
            type="button"
            aria-label="Close analysis settings"
          >
            x
          </button>
        </div>

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

          <label className="analysis-settings-row check-label">
            <input
              type="checkbox"
              checked={humanizeMoves}
              onChange={(event) => onHumanizeMovesChange?.(event.target.checked)}
            />
            <span className="check-custom" />
            Humanize moves
          </label>

          <div className="analysis-settings-elo">
            <label className="analysis-inline-label" htmlFor="analysis-humanize-elo">ELO:</label>
            <input
              id="analysis-humanize-elo"
              className="think-input analysis-settings-elo-input"
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

          <div className="analysis-settings-think">
            <div className="analysis-settings-elo">
              <label className="analysis-inline-label" htmlFor="analysis-think-time">Engine think time</label>
              <input
                id="analysis-think-time"
                className="think-input analysis-settings-elo-input"
                type="number"
                min="1"
                max="60"
                value={thinkingTime}
                onChange={(event) => onThinkingTimeChange?.(Number(event.target.value))}
              />
            </div>

            <input
              className="think-range analysis-settings-range"
              type="range"
              min="1"
              max="60"
              value={thinkingTime}
              onChange={(event) => onThinkingTimeChange?.(Number(event.target.value))}
              aria-label="Engine think time"
            />
          </div>
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
