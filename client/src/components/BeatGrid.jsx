import React, { useEffect, useRef } from 'react';
import { calculateBeatGrid } from '../utils/mixer';

const BeatGrid = ({ bpm, duration, currentTime, color = '#646cff' }) => {
  const canvasRef = useRef(null);
  const width = 400; // Match waveform width
  const height = 20;

  useEffect(() => {
    if (!bpm || !duration) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate beat positions
    const beatGrid = calculateBeatGrid(bpm, duration);
    
    // Draw beat lines
    beatGrid.forEach(beat => {
      const x = (beat.time / duration) * width;
      const lineHeight = beat.isMeasureStart ? height : height / 2;
      const y = height - lineHeight;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = beat.isMeasureStart ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, height);
      ctx.stroke();
    });
    
    // Draw playhead
    if (currentTime) {
      const playheadX = (currentTime / duration) * width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }
    
  }, [bpm, duration, currentTime, color]);

  return (
    <div className="beat-grid">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="beat-grid-canvas"
      />
    </div>
  );
};

export default BeatGrid;