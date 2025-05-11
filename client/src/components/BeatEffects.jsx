import React from 'react';

const BeatEffects = ({ effects, disabled }) => {
  const handleEffectChange = (effect, value) => {
    if (!effects) return;
    
    const time = effects.flangerGain.context.currentTime;
    if (effect === 'flanger') {
      effects.flangerGain.gain.setValueAtTime(value / 100, time);
    } else if (effect === 'phaser') {
      effects.phaserGain.gain.setValueAtTime(value / 100, time);
    }
  };

  return (
    <div className="beat-effects">
      <div className="effect-slider">
        <label>FLANGER</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="0"
          onChange={(e) => handleEffectChange('flanger', Number(e.target.value))}
          disabled={disabled}
          className="effect-slider-horizontal"
        />
      </div>
      <div className="effect-slider">
        <label>PHASER</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="0"
          onChange={(e) => handleEffectChange('phaser', Number(e.target.value))}
          disabled={disabled}
          className="effect-slider-horizontal"
        />
      </div>
    </div>
  );
};

export default BeatEffects;