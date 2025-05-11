import React from 'react';

const VinylDisc = ({ isPlaying, trackName }) => {
  return (
    <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}>
      <div className="vinyl-label">
        <span className="track-title">{trackName || 'No Track'}</span>
      </div>
      <div className="vinyl-grooves"></div>
    </div>
  );
};

export default VinylDisc;