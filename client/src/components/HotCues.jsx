import React, { useState } from 'react';

const HotCues = ({ onSetCue, onTriggerCue, disabled }) => {
  const [activeCues, setActiveCues] = useState({
    A: null,
    B: null,
    C: null,
    D: null
  });

  const handleSetCue = (key) => {
    const cue = onSetCue();
    setActiveCues(prev => ({
      ...prev,
      [key]: cue
    }));
  };

  const handleTriggerCue = (key) => {
    if (activeCues[key]) {
      onTriggerCue(activeCues[key]);
    }
  };

  return (
    <div className="hot-cues">
      {Object.keys(activeCues).map(key => (
        <div key={key} className="cue-point">
          <button
            className={`cue-button ${activeCues[key] ? 'active' : ''}`}
            onDoubleClick={() => handleSetCue(key)}
            onClick={() => handleTriggerCue(key)}
            disabled={disabled}
          >
            {key}
          </button>
        </div>
      ))}
    </div>
  );
};

export default HotCues;