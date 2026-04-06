import React from 'react';
import { HiX, HiCheckCircle } from 'react-icons/hi';

export default function VariationSelectorModal({
  variations,
  currentVariationIndex,
  completedVariations,
  onSelect,
  onClose
}) {
  if (!variations || variations.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content variation-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose a Line</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="variation-list">
            {variations.map((variation, index) => (
              <div
                key={variation.id}
                className={`variation-item ${index === currentVariationIndex ? 'active' : ''} ${completedVariations.has(index) ? 'completed' : ''}`}
                onClick={() => {
                  onSelect(index);
                  onClose();
                }}
              >
                <div className="variation-item-header">
                  <span className="variation-number">Line {index + 1}</span>
                  {variation.isMain && <span className="variation-badge main-badge">Main</span>}
                  {completedVariations.has(index) && (
                    <span className="variation-badge completed-badge">
                      <HiCheckCircle size={16} /> Completed
                    </span>
                  )}
                </div>
                <h3 className="variation-name">{variation.name}</h3>
                <p className="variation-description">{variation.description}</p>
                <div className="variation-moves-preview">
                  {variation.moves.substring(0, 60)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
