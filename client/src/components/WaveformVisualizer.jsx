import React, { useEffect, useRef } from 'react';
import { getFrequencyData } from '../utils/mixer';

const WaveformVisualizer = ({ analyser, color = '#646cff' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      const data = getFrequencyData(analyser);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / data.length * 2;
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      
      data.forEach((value, i) => {
        const percent = value / 255;
        const barHeight = height * percent;
        const x = i * barWidth;
        const y = height - barHeight;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width="200" 
      height="60" 
      className="waveform-visualizer"
    />
  );
};

export default WaveformVisualizer;