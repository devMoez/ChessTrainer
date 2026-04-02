import React from 'react';

/**
 * SKELETON PLACEHOLDER FOR PUZZLE CARDS
 * Displayed while cache is loading to prevent layout shift
 */
export default function PuzzleCardSkeleton() {
  return (
    <article className="puzzle-card-skeleton">
      <div className="skeleton-board" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-desc" />
        <div className="skeleton-desc short" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
        <div className="skeleton-button" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .puzzle-card-skeleton {
          width: 100%;
          max-width: 320px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          contain: layout style paint;
        }
        
        .skeleton-board {
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--bg-elevated) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        .skeleton-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .skeleton-title {
          height: 20px;
          width: 70%;
          background: var(--bg-elevated);
          border-radius: 4px;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        
        .skeleton-desc {
          height: 16px;
          width: 100%;
          background: var(--bg-elevated);
          border-radius: 4px;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          animation-delay: 0.1s;
        }
        
        .skeleton-desc.short {
          width: 60%;
          animation-delay: 0.2s;
        }
        
        .skeleton-tags {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        
        .skeleton-tag {
          height: 20px;
          width: 50px;
          background: var(--bg-elevated);
          border-radius: 6px;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        
        .skeleton-button {
          height: 38px;
          width: 100%;
          margin-top: 8px;
          background: var(--bg-elevated);
          border-radius: 10px;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </article>
  );
}
