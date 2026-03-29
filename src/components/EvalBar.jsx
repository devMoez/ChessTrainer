import React, { memo, useMemo } from 'react';

const EvalBar = memo(function EvalBar({ percent = 50, scoreText = '0.0', height = 400 }) {
  const { blackHeight, separatorPos, whiteHeight } = useMemo(() => {
    const clampedPercent = Math.max(0, Math.min(100, percent));

    return {
      blackHeight: `${100 - clampedPercent}%`,
      separatorPos: `${100 - clampedPercent}%`,
      whiteHeight: `${clampedPercent}%`,
    };
  }, [percent]);

  return (
    <div className="eval-bar-container" style={{ height }}>
      <div className="eval-score-top">
        {scoreText}
      </div>
      <div
        className="eval-bar-track"
        title={`Evaluation: ${scoreText}`}
        aria-label={`Position evaluation: ${scoreText}`}
      >
        <div
          className="eval-bar-black"
          style={{ height: blackHeight }}
        />

        <div
          className="eval-bar-separator"
          style={{
            position: 'absolute',
            top: separatorPos,
            left: 0,
            right: 0,
            height: '2px',
            zIndex: 5,
          }}
        />

        <div
          className="eval-bar-white"
          style={{ height: whiteHeight }}
        />
      </div>
    </div>
  );
});

export default EvalBar;
