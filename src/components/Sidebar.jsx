import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiBookOpen,
  HiChartBar,
  HiCog,
  HiHome,
  HiPlay,
  HiLightBulb,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: HiHome },
  { to: '/play', label: 'Play', Icon: HiPlay },
  { to: '/openings', label: 'Openings', Icon: HiBookOpen },
  { to: '/analysis', label: 'Analysis', Icon: HiChartBar },
  { to: '/puzzles', label: 'Puzzles', Icon: HiBookOpen },
  { to: '/coach', label: 'AI Coach', Icon: HiLightBulb },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" aria-hidden="true">N</div>
        <div className="logo-text">
          <span>Chess</span>
          <span>Trainer</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, Icon: NAV_ICON }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {React.createElement(NAV_ICON)}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <Link
          to="/settings"
          className={`sidebar-item${location.pathname === '/settings' ? ' active' : ''}`}
        >
          <HiCog />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
