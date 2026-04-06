import React from 'react';
import { HiRefresh, HiArrowRight, HiViewGrid, HiLightBulb } from 'react-icons/hi';

export default function VariationControlBar({
  currentVariationIndex,
  totalVariations,
  onRepeatLine,
  onNextLine,
  onChooseLine,
  onHint,
  isCompleted
}) {
  return (
    <div className="variation-control-bar">
      <div className="variation-info">
        <span className="variation-counter">
          Line {currentVariationIndex + 1} of {totalVariations}
        </span>
      </div>
      
      <div className="variation-controls">
        <button
          className="variation-btn"
          onClick={onRepeatLine}
          title="Repeat Line"
        >
          <HiRefresh size={18} />
          <span>Repeat Line</span>
        </button>

        <button
          className="variation-btn"
          onClick={onNextLine}
          disabled={currentVariationIndex >= totalVariations - 1}
          title="Next Line"
        >
          <HiArrowRight size={18} />
          <span>Next Line</span>
        </button>

        <button
          className="variation-btn"
          onClick={onChooseLine}
          title="Choose Line"
        >
          <HiViewGrid size={18} />
          <span>Choose Line</span>
        </button>

        <button
          className="variation-btn hint-btn"
          onClick={onHint}
          disabled={isCompleted}
          title="Show Hint"
        >
          <HiLightBulb size={18} />
          <span>Hint</span>
        </button>
      </div>
    </div>
  );
}
