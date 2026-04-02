import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * CursorLockedElement: A high-performance UI interaction that locks an element to the cursor
 * with zero delay and no smoothing. 
 * 
 * Uses direct DOM updates (ref.style.transform) within a window mousemove listener
 * to bypass React's render cycle for the "locked" feel.
 */
export const CursorLockedElement = ({ children, isActive = true, onDrop }) => {
  const elementRef = useRef(null);
  
  // Use a ref for current mouse position to avoid state-induced lag
  const mousePos = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback((e) => {
    if (!isActive || !elementRef.current) return;

    // Use raw client coordinates for immediate sync
    const { clientX, clientY } = e;
    
    // Direct DOM manipulation for zero-delay performance
    // transform: translate3d(x, y, 0) is hardware-accelerated
    // We subtract half the width/height to keep it perfectly centered on the cursor
    const rect = elementRef.current.getBoundingClientRect();
    const offsetX = rect.width / 2;
    const offsetY = rect.height / 2;

    elementRef.current.style.transform = `translate3d(${clientX - offsetX}px, ${clientY - offsetY}px, 0)`;
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('mousemove', updatePosition);
      // Also update once immediately on activation to snap to current cursor
      // (Requires the last known mouse event, or just wait for next move)
    } else {
      window.removeEventListener('mousemove', updatePosition);
    }

    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, [isActive, updatePosition]);

  const handleMouseUp = () => {
    if (onDrop) onDrop();
  };

  const style = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    pointerEvents: 'none', // Crucial: avoid blocking mouse events underneath
    willChange: 'transform', // Optimization hint for browser
    display: isActive ? 'block' : 'none',
    // Zero transition/smoothing
    transition: 'none',
  };

  return (
    <div 
      ref={elementRef} 
      style={style}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  );
};

/**
 * Example Usage / Demo Wrapper
 */
export const DraggableChessPiece = ({ pieceChar = 'P' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = () => setIsDragging(true);
  const stopDrag = () => setIsDragging(false);

  return (
    <div style={{ padding: '20px' }}>
      {/* Target area to click and "pick up" */}
      <div 
        onMouseDown={startDrag}
        style={{
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px dashed #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          borderRadius: '8px'
        }}
      >
        Click & Hold
      </div>

      {/* The Locked Element */}
      {isDragging && (
        <CursorLockedElement 
          isActive={isDragging} 
          onDrop={stopDrag}
        >
          {/* Example: A simple colored div as the "piece" */}
          <div style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#4a90e2',
            borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>
            {pieceChar}
          </div>
        </CursorLockedElement>
      )}

      {/* Clean up listener on mouseup anywhere */}
      {isDragging && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }} 
          onMouseUp={stopDrag} 
        />
      )}
    </div>
  );
};

export default CursorLockedElement;
