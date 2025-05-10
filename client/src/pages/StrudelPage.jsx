import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { defaultPatterns } from '../utils/strudel';

// Import Strudel packages
import '@strudel/web';
import '@strudel/repl';
import '@strudel/embed';

const StrudelPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState('basic');

  // Create URL-safe pattern
  const getStrudelUrl = (pattern) => {
    const base = 'https://strudel.cc/#';
    const encodedPattern = btoa(pattern);
    return base + encodedPattern;
  };

  const handlePatternChange = (pattern) => {
    setSelectedPattern(pattern);
    setIsLoading(true);
  };

  return (
    <div className="strudel-container">
      <div className="strudel-header">
        <h2>Strudel Mode</h2>
        <div className="controls-panel">
          <div className="pattern-selector">
            <label>Pattern:</label>
            <select 
              value={selectedPattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              disabled={isLoading}
            >
              {Object.keys(defaultPatterns).map(pattern => (
                <option key={pattern} value={pattern}>
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="strudel-content">
        {isLoading && (
          <div className="loading-results">
            <LoadingSpinner />
            <p>Loading Strudel...</p>
          </div>
        )}
        
        <iframe
          src={getStrudelUrl(defaultPatterns[selectedPattern])}
          width="100%"
          height="600"
          onLoad={() => setIsLoading(false)}
          style={{ border: 'none' }}
          title="Strudel Editor"
        />
      </div>
    </div>
  );
};

export default StrudelPage;