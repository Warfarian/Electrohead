import React from 'react';

const FilterControl = ({ filter, disabled }) => {
  const handleFilterChange = (value) => {
    if (!filter) return;
    
    // Map 0-100 to frequency range (20Hz - 20kHz) exponentially
    const minFreq = 20;
    const maxFreq = 20000;
    const exp = 4; // Exponential curve factor
    
    const normalized = value / 100;
    const frequency = minFreq + (maxFreq - minFreq) * Math.pow(normalized, exp);
    
    filter.frequency.setValueAtTime(frequency, filter.context.currentTime);
  };

  return (
    <div className="filter-control">
      <label>FILTER</label>
      <input
        type="range"
        min="0"
        max="100"
        defaultValue="100"
        onChange={(e) => handleFilterChange(Number(e.target.value))}
        disabled={disabled}
        className="filter-slider-vertical"
      />
    </div>
  );
};

export default FilterControl;