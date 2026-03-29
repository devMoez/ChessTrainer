import React from 'react';
import { HiX } from 'react-icons/hi';
import {
  CrownIcon,
  DrawEmblemIcon,
  HourglassIcon,
  WhiteFlagIcon,
} from './PremiumResultIcons.jsx';

function colorName(color) {
  return color === 'w' ? 'White' : 'Black';
}

function getCopy(result) {
  const { reason, winner, loser, title: customTitle, subtitle: customSubtitle } = result || {};

  const withOverrides = (copy) => ({
    ...copy,
    title: customTitle || copy.title,
    subtitle: customSubtitle || copy.subtitle,
  });

  if (reason === 'checkmate') {
    return withOverrides({
      icon: <CrownIcon className="gr-icon-svg" title="Checkmate" />,
      title: `${colorName(winner)} wins`,
      subtitle: `${colorName(winner)} wins by checkmate.`,
      badge: 'win',
    });
  }
  if (reason === 'timeout') {
    return withOverrides({
      icon: <HourglassIcon className="gr-icon-svg" title="Timeout" />,
      title: `${colorName(loser)} ran out of time`,
      subtitle: `${colorName(winner)} wins on time.`,
      badge: 'timeout',
    });
  }
  if (reason === 'resign') {
    return withOverrides({
      icon: <WhiteFlagIcon className="gr-icon-svg" title="Resignation" />,
      title: `${colorName(loser)} resigned`,
      subtitle: `${colorName(winner)} wins by resignation.`,
      badge: 'resign',
    });
  }
  if (reason === 'stalemate') {
    return withOverrides({
      icon: <DrawEmblemIcon className="gr-icon-svg" title="Stalemate" />,
      title: 'Stalemate',
      subtitle: 'The game ended in stalemate.',
      badge: 'draw',
    });
  }
  if (reason === 'threefold') {
    return withOverrides({
      icon: <DrawEmblemIcon className="gr-icon-svg" title="Threefold repetition" />,
      title: 'Draw by repetition',
      subtitle: 'The position was repeated three times.',
      badge: 'draw',
    });
  }
  if (reason === 'insufficientMaterial') {
    return withOverrides({
      icon: <DrawEmblemIcon className="gr-icon-svg" title="Insufficient material" />,
      title: 'Insufficient material',
      subtitle: 'Neither side has enough pieces to checkmate.',
      badge: 'draw',
    });
  }

  return withOverrides({
    icon: <DrawEmblemIcon className="gr-icon-svg" title="Draw" />,
    title: 'Draw',
    subtitle: 'The game ended in a draw.',
    badge: 'draw',
  });
}

export default function GameResultModal({
  open = true,
  result,
  onRematch,
  onNewGame,
  onAnalysis,
  analysisLabel = 'Analysis',
  onClose,
}) {
  if (!result) return null;
  if (!open) return null;

  const { icon, title, subtitle, badge } = getCopy(result);

  return (
    <div
      className="game-result-backdrop"
      onClick={onClose || (() => {})}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gr-title"
      id="game-result-modal"
    >
      <div
        className="game-result-card"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="gr-close"
          type="button"
          onClick={onClose || (() => {})}
          aria-label="Close game result popup"
        >
          <HiX />
        </button>
        <div className={`gr-icon gr-icon-${badge}`} aria-hidden="true">
          {icon}
        </div>
        <h2 className="gr-title" id="gr-title">{title}</h2>
        <p className="gr-subtitle">{subtitle}</p>

        <div className="gr-actions">
          {onRematch ? (
            <button className="btn btn-primary" onClick={onRematch} id="modal-rematch-btn" autoFocus>
              Rematch
            </button>
          ) : null}

          <button className="btn btn-ghost" onClick={onNewGame} id="modal-new-game-btn">
            New Game
          </button>

          {onAnalysis && (
            <button className="btn btn-ghost" onClick={onAnalysis} id="modal-analysis-btn">
              {analysisLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
