import React from 'react';
import { 
  HiBookOpen, HiPlay, HiChartBar, HiAcademicCap, HiPencilAlt 
} from 'react-icons/hi';

export default function ProfilePage() {
  const stats = [
    { label: 'Openings Learned', value: '8', sub: '4 more to reach your goal', icon: HiBookOpen },
    { label: 'Practice Games', value: '47', sub: '12 wins this week', icon: HiPlay },
    { label: 'Win Rate', value: '68%', sub: '+5% from last month', icon: HiChartBar },
    { label: 'Achievements', value: '12', sub: '3 unlocked this week', icon: HiAcademicCap },
  ];

  const learningProgress = [
    { label: 'Beginner Openings', progress: 100 },
    { label: 'Intermediate Openings', progress: 65 },
    { label: 'Advanced Openings', progress: 30 },
  ];

  const savedOpenings = ['Italian Game', 'Sicilian Defense', 'Queen\'s Gambit', 'Ruy Lopez'];

  const recentActivity = [
    { text: 'Completed Italian Game training', time: '2 hours ago' },
    { text: 'Won practice game against AI', time: '5 hours ago' },
    { text: 'Learned Queen\'s Gambit', time: '1 day ago' },
    { text: 'Unlocked \'Opening Master\' achievement', time: '2 days ago' },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1 className="h2">Profile</h1>
        <p className="caption">Track your progress and achievements</p>
      </header>

      {/* Profile Card */}
      <section className="profile-summary-card">
        <div className="profile-info">
          <div className="profile-avatar-large">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ChessMaster" alt="Profile" />
          </div>
          <div className="profile-details">
            <h3>ChessMaster</h3>
            <p className="caption">chessmaster@example.com</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">
          <HiPencilAlt /> Edit Profile
        </button>
      </section>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="profile-stat-item">
            <div className="stat-header">
              <span className="caption">{stat.label}</span>
              <stat.icon className="stat-icon" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-subtext">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="profile-content-grid">
        {/* Left Column */}
        <div className="profile-main-column">
          {/* Learning Progress */}
          <section className="profile-section">
            <h3 className="section-title-sm">Learning Progress</h3>
            <p className="caption mb-md">Track your mastery of different opening categories</p>
            
            <div className="progress-list">
              {learningProgress.map((item, i) => (
                <div key={i} className="progress-item">
                  <div className="progress-labels">
                    <span>{item.label}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Saved Openings */}
          <section className="profile-section">
            <h3 className="section-title-sm">Saved Openings</h3>
            <p className="caption mb-md">Your favorite openings to practice</p>
            <div className="tag-list">
              {savedOpenings.map((tag, i) => (
                <span key={i} className="opening-tag">{tag}</span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column / Recent Activity */}
        <div className="profile-side-column">
          <section className="profile-section">
            <h3 className="section-title-sm">Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((act, i) => (
                <div key={i} className="activity-item">
                  <p className="activity-text">{act.text}</p>
                  <span className="activity-time">{act.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
