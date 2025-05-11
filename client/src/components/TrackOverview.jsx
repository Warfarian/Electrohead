import React, { useEffect, useRef } from 'react';
import { generateWaveformData } from '../utils/mixer';
import BeatGrid from './BeatGrid';

const TrackOverview = ({ audioBuffer, currentTime, duration, bpm, color = '#646cff' }) => {
  const canvasRef = useRef(null);
  const width = 400; // Fixed width for waveform
  const height = 80;

  useEffect(() => {
    if (!audioBuffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Generate and draw waveform
    const waveformData = generateWaveformData(audioBuffer, width);
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Draw waveform
    const centerLine = height / 2;
    waveformData.forEach((value, i) => {
      const barHeight = value * height;
      ctx.fillRect(i, centerLine - barHeight / 2, 1, barHeight);
    });
    
    // Draw progress
    if (duration) {
      const progress = (currentTime / duration) * width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, progress, height);
    }
    
  }, [audioBuffer, currentTime, duration, color]);

  return (
    <div className="track-overview">
      {bpm && (
        <BeatGrid
          bpm={bpm}
          duration={duration}
          currentTime={currentTime}
          color={color}
        />
      )}
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="waveform-overview"
      />
      {duration && (
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TrackOverview;