import React from 'react';

export default function Logo({ variant = 'full' }) {
  return (
    <div className="sidebar-logo">
      <div className="logo-icon" aria-hidden="true">♞</div>
      {variant === 'full' && (
        <div className="logo-text">
          <span>Chess</span>
          <span>Trainer</span>
        </div>
      )}
    </div>
  );
}
