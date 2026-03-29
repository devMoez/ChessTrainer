import React, { useRef, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight, HiChevronDoubleLeft, HiChevronDoubleRight, HiSwitchHorizontal } from 'react-icons/hi';

export default function MoveList({ moves = [], currentIndex = -1, onNavigate, onFlip }) {
  const bodyRef = useRef(null);

  // Auto-scroll to current move
  useEffect(() => {
    if (bodyRef.current && currentIndex >= 0) {
      const el = bodyRef.current.querySelector(`[data-move-idx="${currentIndex}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  // Build pairs: [{num, white, black}]
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      whiteIdx: i,
      whiteSan: moves[i]?.san ?? '',
      blackIdx: i + 1,
      blackSan: moves[i + 1]?.san ?? '',
    });
  }

  return (
    <div className="move-list-panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="move-list-header">Moves</div>

      <div className="move-list-body" ref={bodyRef}>
        {pairs.length === 0 ? (
          <p style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No moves yet — make the first move!
          </p>
        ) : (
          pairs.map(pair => (
            <div key={pair.num} className="move-pair">
              <span className="move-num">{pair.num}.</span>
              <span
                className={`move-san white${currentIndex === pair.whiteIdx ? ' current' : ''}`}
                data-move-idx={pair.whiteIdx}
                onClick={() => onNavigate && onNavigate(pair.whiteIdx)}
                title={pair.whiteSan}
              >
                {pair.whiteSan}
              </span>
              {pair.blackSan && (
                <span
                  className={`move-san black${currentIndex === pair.blackIdx ? ' current' : ''}`}
                  data-move-idx={pair.blackIdx}
                  onClick={() => onNavigate && onNavigate(pair.blackIdx)}
                  title={pair.blackSan}
                >
                  {pair.blackSan}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="move-list-controls">
        <button className="move-ctrl-btn" onClick={() => onNavigate && onNavigate(-1)} title="Start" aria-label="Go to start" id="move-ctrl-start">
          <HiChevronDoubleLeft />
        </button>
        <button
          className="move-ctrl-btn"
          onClick={() => onNavigate && onNavigate(Math.max(-1, currentIndex - 1))}
          title="Previous"
          aria-label="Previous move"
          id="move-ctrl-prev"
        >
          <HiChevronLeft />
        </button>
        <button
          className="move-ctrl-btn"
          onClick={() => onNavigate && onNavigate(Math.min(moves.length - 1, currentIndex + 1))}
          title="Next"
          aria-label="Next move"
          id="move-ctrl-next"
        >
          <HiChevronRight />
        </button>
        <button
          className="move-ctrl-btn"
          onClick={() => onNavigate && onNavigate(moves.length - 1)}
          title="End"
          aria-label="Go to end"
          id="move-ctrl-end"
        >
          <HiChevronDoubleRight />
        </button>
        {onFlip && (
          <button className="move-ctrl-btn" onClick={onFlip} title="Flip board" aria-label="Flip board" id="move-ctrl-flip">
            <HiSwitchHorizontal />
          </button>
        )}
      </div>
    </div>
  );
}
