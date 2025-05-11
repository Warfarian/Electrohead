import React from 'react';

const EQControls = ({ eq, disabled }) => {
  const handleEQChange = (band, value) => {
    if (!eq || !eq[band]) return;
    // Convert range from 0-100 to -40 to +40 dB
    const gain = ((value - 50) / 50) * 40;
    eq[band].gain.setValueAtTime(gain, eq[band].context.currentTime);
  };

  return (
    <div className="eq-controls">
      <div className="eq-slider">
        <label>HIGH</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          onChange={(e) => handleEQChange('high', Number(e.target.value))}
          disabled={disabled}
          className="eq-slider-vertical"
        />
      </div>
      <div className="eq-slider">
        <label>MID</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          onChange={(e) => handleEQChange('mid', Number(e.target.value))}
          disabled={disabled}
          className="eq-slider-vertical"
        />
      </div>
      <div className="eq-slider">
        <label>LOW</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          onChange={(e) => handleEQChange('low', Number(e.target.value))}
          disabled={disabled}
          className="eq-slider-vertical"
        />
      </div>
    </div>
  );
};

export default EQControls;