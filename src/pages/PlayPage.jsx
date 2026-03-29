import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlay, HiChartBar, HiSparkles, HiChip, HiUserGroup, HiAcademicCap } from 'react-icons/hi';
import PracticeSetupModal from '../components/PracticeSetupModal.jsx';

const GAME_MODES = [
  {
    id: 'vs-stockfish',
    title: 'VS Stockfish',
    description: 'Play against the powerful Stockfish engine. Choose your difficulty level and test your skills.',
    icon: HiChartBar,
    color: '#4CAF50',
    action: '/play/computer',
    tags: [
      { id: 't1', label: 'Beginner', type: 'primary' },
      { id: 't2', label: 'Intermediate', type: 'secondary' },
      { id: 't3', label: 'Advanced', type: 'secondary' }
    ],
    visual: {
      type: 'vs',
      vsText: 'VS',
      icon: HiChip, // Stockfish/CPU icon
      iconColor: '#4CAF50'
    }
  },
  {
    id: 'vs-human',
    title: 'VS Human',
    description: 'Play against friends online or locally. Share your board and compete in real-time matches.',
    icon: HiPlay,
    color: '#2196F3',
    action: '/play/human',
    tags: [
      { id: 't4', label: 'Local', type: 'primary' },
      { id: 't5', label: 'Online', type: 'secondary' }
    ],
    visual: {
      type: 'vs',
      vsText: 'VS',
      icon: HiUserGroup, // Human/users icon
      iconColor: '#2196F3'
    }
  },
  {
    id: 'practice',
    title: 'Practice',
    description: 'Practice specific openings, endgames, or positions. Customize your training session.',
    icon: HiSparkles,
    color: '#9C27B0',
    action: 'modal:practice',
    tags: [
      { id: 't6', label: 'Openings', type: 'primary' },
      { id: 't7', label: 'Engine', type: 'secondary' },
      { id: 't8', label: 'Trainer', type: 'secondary' }
    ],
    visual: {
      type: 'practice',
      icon: HiAcademicCap,
      iconColor: '#9C27B0'
    }
  },
];

function GameModeCard({ mode, onClick }) {
  const Icon = mode.icon;
  const visual = mode.visual || {};

  return (
    <article
      className="game-mode-card"
      onClick={() => onClick(mode)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(mode);
        }
      }}
      aria-label={`Play ${mode.title}`}
    >
      {/* Visual Section */}
      <div className="game-mode-visual">
        {visual.type === 'vs' && (
          <div className="vs-container">
            <div className="vs-text">{visual.vsText}</div>
            <div className="vs-icons">
              {visual.icon && <visual.icon className="vs-icon" style={{ color: visual.iconColor }} />}
              {visual.icon && <visual.icon className="vs-icon" style={{ color: visual.iconColor }} />}
            </div>
          </div>
        )}
        {visual.type === 'practice' && (
          <div className="practice-container">
            <visual.icon className="practice-icon" style={{ color: visual.iconColor, fontSize: '48px' }} />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="game-mode-card-info">
        <h3 className="game-mode-title">{mode.title}</h3>
        {mode.tags && (
          <div className="game-mode-tags">
            {mode.tags.map(t => (
              <span key={t.id} className={`game-mode-tag ${t.type}`}>{t.label}</span>
            ))}
          </div>
        )}
        <p className="game-mode-description">{mode.description}</p>

        <button
          className="game-mode-btn"
          style={{
            background: mode.color,
            border: `1px solid ${mode.color}`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(mode);
          }}
        >
          Start
        </button>
      </div>
    </article>
  );
}

export default function PlayPage() {
  const navigate = useNavigate();
  const [isPracticeModalOpen, setIsPracticeModalOpen] = React.useState(false);

  const handleCardClick = (mode) => {
    if (mode.action === 'modal:practice') {
      setIsPracticeModalOpen(true);
    } else {
      navigate(mode.action);
    }
  };

  return (
    <div className="play-page-dashboard">
      <div className="play-page-header">
        <h1 className="play-page-title">Choose Your Game Mode</h1>
        <p className="play-page-subtitle">
          Select how you want to play and start improving your chess skills
        </p>
      </div>

      <div className="game-modes-grid">
        {GAME_MODES.map((mode) => (
          <GameModeCard
            key={mode.id}
            mode={mode}
            onClick={handleCardClick}
          />
        ))}
      </div>

      <PracticeSetupModal
        open={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
      />
    </div>
  );
}
