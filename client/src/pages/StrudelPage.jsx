import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { defaultPatterns } from '../utils/strudel';

// Import Strudel packages
import '@strudel/web';
import '@strudel/repl';
import '@strudel/embed';

const StrudelPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState('basic');
  const [vibeScore, setVibeScore] = useState(5);

  // Create URL-safe pattern
  const getStrudelUrl = (pattern) => {
    const base = 'https://strudel.cc/#';
    const encodedPattern = btoa(pattern);
    return base + encodedPattern;
  };

  const handlePatternChange = (pattern) => {
    setSelectedPattern(pattern);
    setIsLoading(true);
    
    // Mock crowd reaction based on pattern complexity
    const pattern_complexity = defaultPatterns[pattern].split('\n').length;
    const new_score = Math.min(5 + (pattern_complexity / 2), 10);
    
    // Update vibe score with a delay to simulate processing
    setTimeout(() => {
      setVibeScore(new_score);
      // Update parent component's crowd reaction
      window.dispatchEvent(new CustomEvent('crowdReactionUpdate', { 
        detail: {
          reaction: new_score >= 8 ? "Crowd goes wild!" : 
                   new_score >= 6 ? "Nice groove!" : 
                   "Warming up...",
          message: new_score >= 8 ? "The crowd is loving this complex pattern!" :
                  new_score >= 6 ? "The rhythm is getting people moving." :
                  "The crowd is waiting to see where this goes...",
          score: new_score
        }
      }));
    }, 1000);
  };

  // Initial crowd reaction
  useEffect(() => {
    handlePatternChange(selectedPattern);
  }, []);

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