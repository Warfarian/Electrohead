import React from 'react';

const EffectsControls = ({ effects, disabled }) => {
  const handleEffectChange = (effect, value) => {
    if (!effects) return;
    
    const time = effects.delay.context.currentTime;
    if (effect === 'delay') {
      effects.delayGain.gain.setValueAtTime(value / 100, time);
    } else if (effect === 'reverb') {
      effects.reverbGain.gain.setValueAtTime(value / 100, time);
    }
  };

  return (
    <div className="effects-controls">
      <div className="effect-slider">
        <label>DELAY</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="0"
          onChange={(e) => handleEffectChange('delay', Number(e.target.value))}
          disabled={disabled}
          className="effect-slider-horizontal"
        />
      </div>
      <div className="effect-slider">
        <label>REVERB</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="0"
          onChange={(e) => handleEffectChange('reverb', Number(e.target.value))}
          disabled={disabled}
          className="effect-slider-horizontal"
        />
      </div>
    </div>
  );
};

export default EffectsControls;