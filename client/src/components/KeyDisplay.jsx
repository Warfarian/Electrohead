import React from 'react';

const KeyDisplay = ({ musicalKey, compatibility }) => {
  const getCompatibilityColor = () => {
    switch (compatibility) {
      case 'Perfect Match': return '#00ff00';
      case 'Relative Key': return '#00cc00';
      case 'Compatible': return '#ffff00';
      case 'Use Caution': return '#ff9900';
      case 'Key Clash': return '#ff0000';
      default: return '#646cff';
    }
  };

  return (
    <div className="key-display">
      <div className="key-info">
        <span className="key-label">KEY</span>
        <span className="key-value">{musicalKey || '-'}</span>
      </div>
      {compatibility && (
        <div 
          className="key-compatibility"
          style={{ color: getCompatibilityColor() }}
        >
          {compatibility}
        </div>
      )}
    </div>
  );
};

export default KeyDisplay;