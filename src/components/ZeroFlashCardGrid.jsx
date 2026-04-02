import React, { useMemo, useLayoutEffect, useState, useRef } from 'react';

/**
 * ZeroFlashCardGrid: A high-performance card UI that ensures cards appear 
 * in their final positions on the very first paint.
 * 
 * Strategies:
 * 1. Synchronous layout calculation (in useMemo/useLayoutEffect).
 * 2. Absolute positioning with transform: translate3d() for GPU acceleration.
 * 3. Initial visibility: hidden until layout is confirmed (within the same task).
 */
const CARD_WIDTH = 280;
const CARD_HEIGHT = 160;
const GAP = 20;

export const ZeroFlashCardGrid = ({ items = [] }) => {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState({ columns: 0, cardPositions: [], isReady: false });

  // useLayoutEffect runs SYNCHRONOUSLY after all DOM mutations but BEFORE the browser paints.
  // This is the key to preventing the "blank flash" or "pop-in".
  useLayoutEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const columns = Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)));
      
      const cardPositions = items.map((_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return {
          x: column * (CARD_WIDTH + GAP),
          y: row * (CARD_HEIGHT + GAP),
        };
      });

      setLayout({
        columns,
        cardPositions,
        isReady: true,
      });
    };

    calculateLayout();

    // Re-calculate on resize
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [items]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    // We estimate the height to prevent layout shift below the grid
    minHeight: layout.isReady 
      ? Math.ceil(items.length / layout.columns) * (CARD_HEIGHT + GAP) 
      : '500px',
    // Keep hidden until layout is calculated in useLayoutEffect
    visibility: layout.isReady ? 'visible' : 'hidden',
    opacity: layout.isReady ? 1 : 0,
    transition: 'opacity 0.2s ease-in', // Optional fade-in that doesn't delay position
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {items.map((item, index) => {
        const pos = layout.cardPositions[index] || { x: 0, y: 0 };
        
        return (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              // The key to ZERO delay: direct transform from the first paint
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              willChange: 'transform',
              background: 'var(--bg-surface, #2a2a2a)',
              borderRadius: '12px',
              border: '1px solid var(--border, #333)',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              // No entry animations that move the card
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary, #fff)' }}>
              {item.title}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary, #aaa)', fontSize: '14px' }}>
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Demo Component
 */
export const CardGridDemo = () => {
  const demoItems = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    title: `Card ${i + 1}`,
    description: 'This card appeared instantly in its final position without any flash or layout shift.'
  })), []);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>Zero-Flash Instant Card UI</h2>
      <ZeroFlashCardGrid items={demoItems} />
    </div>
  );
};

export default ZeroFlashCardGrid;
