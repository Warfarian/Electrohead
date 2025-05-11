import React, { useState } from 'react';

const LoopControls = ({ onSetLoop, disabled }) => {
  const [isLooping, setIsLooping] = useState(false);
  const [loopLength, setLoopLength] = useState(4); // 4 beats

  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
    onSetLoop(!isLooping, loopLength);
  };

  const handleLoopLengthChange = (value) => {
    setLoopLength(value);
    if (isLooping) {
      onSetLoop(true, value);
    }
  };

  return (
    <div className="loop-controls">
      <button
        className={`loop-button ${isLooping ? 'active' : ''}`}
        onClick={handleLoopToggle}
        disabled={disabled}
      >
        LOOP
      </button>
      <div className="loop-length">
        <button
          className={`loop-length-button ${loopLength === 1 ? 'active' : ''}`}
          onClick={() => handleLoopLengthChange(1)}
          disabled={disabled}
        >
          1
        </button>
        <button
          className={`loop-length-button ${loopLength === 2 ? 'active' : ''}`}
          onClick={() => handleLoopLengthChange(2)}
          disabled={disabled}
        >
          2
        </button>
        <button
          className={`loop-length-button ${loopLength === 4 ? 'active' : ''}`}
          onClick={() => handleLoopLengthChange(4)}
          disabled={disabled}
        >
          4
        </button>
        <button
          className={`loop-length-button ${loopLength === 8 ? 'active' : ''}`}
          onClick={() => handleLoopLengthChange(8)}
          disabled={disabled}
        >
          8
        </button>
      </div>
    </div>
  );
};

export default LoopControls;