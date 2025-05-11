import React, { useEffect, useRef, useState } from 'react';
import { TrackAnalyzer, AnalysisVisualizer } from '../utils/analyzer';

const TrackAnalysis = ({ audioContext, audioBuffer }) => {
  const [analysis, setAnalysis] = useState(null);
  const [activeView, setActiveView] = useState('waveform');
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const visualizerRef = useRef(null);

  useEffect(() => {
    if (audioContext && !analyzerRef.current) {
      analyzerRef.current = new TrackAnalyzer(audioContext);
    }
    if (canvasRef.current && !visualizerRef.current) {
      visualizerRef.current = new AnalysisVisualizer(canvasRef.current);
    }
  }, [audioContext]);

  useEffect(() => {
    const analyzeTrack = async () => {
      if (!audioBuffer || !analyzerRef.current) return;

      const bpmAnalysis = await analyzerRef.current.analyzeBPM(audioBuffer);
      const keyAnalysis = await analyzerRef.current.analyzeKey(audioBuffer);
      const energyAnalysis = await analyzerRef.current.analyzeEnergy(audioBuffer);
      const waveformData = await analyzerRef.current.generateWaveform(audioBuffer, canvasRef.current.width);

      setAnalysis({
        bpm: bpmAnalysis,
        key: keyAnalysis,
        energy: energyAnalysis,
        waveform: waveformData
      });

      // Draw initial view
      updateVisualization(activeView, {
        bpm: bpmAnalysis,
        key: keyAnalysis,
        energy: energyAnalysis,
        waveform: waveformData
      });
    };

    analyzeTrack();
  }, [audioBuffer, activeView]);

  const updateVisualization = (view, data) => {
    if (!visualizerRef.current || !data) return;

    switch (view) {
      case 'waveform':
        visualizerRef.current.drawWaveform(data.waveform);
        break;
      case 'spectrum':
        visualizerRef.current.drawSpectrum(analyzerRef.current.dataArray);
        break;
      case 'energy':
        visualizerRef.current.drawEnergyBands(data.energy);
        break;
      case 'beatgrid':
        visualizerRef.current.drawBeatGrid(data.bpm.bpm, audioBuffer.duration);
        break;
      default:
        break;
    }
  };

  return (
    <div className="track-analysis">
      <div className="analysis-header">
        <h4>TRACK ANALYSIS</h4>
        <div className="analysis-stats">
          {analysis && (
            <>
              <div className="stat-group">
                <span className="stat-label">BPM</span>
                <span className="stat-value">
                  {analysis.bpm.bpm}
                  <span className="stat-confidence">
                    ±{Math.round((1 - analysis.bpm.confidence) * 10)}
                  </span>
                </span>
              </div>
              <div className="stat-group">
                <span className="stat-label">KEY</span>
                <span className="stat-value">
                  {analysis.key.key} {analysis.key.scale}
                  <span className="stat-confidence">
                    {Math.round(analysis.key.confidence * 100)}%
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="analysis-view-controls">
        <button
          className={`view-button ${activeView === 'waveform' ? 'active' : ''}`}
          onClick={() => setActiveView('waveform')}
        >
          Waveform
        </button>
        <button
          className={`view-button ${activeView === 'spectrum' ? 'active' : ''}`}
          onClick={() => setActiveView('spectrum')}
        >
          Spectrum
        </button>
        <button
          className={`view-button ${activeView === 'energy' ? 'active' : ''}`}
          onClick={() => setActiveView('energy')}
        >
          Energy
        </button>
        <button
          className={`view-button ${activeView === 'beatgrid' ? 'active' : ''}`}
          onClick={() => setActiveView('beatgrid')}
        >
          Beat Grid
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="analysis-canvas"
        width={800}
        height={200}
      />
      {analysis && activeView === 'energy' && (
        <div className="energy-bands">
          {Object.entries(analysis.energy).map(([band, data]) => (
            <div key={band} className="energy-band">
              <span className="band-label">{band}</span>
              <div className="band-meter">
                <div
                  className="band-fill"
                  style={{ width: `${data.energy * 100}%` }}
                />
              </div>
              <span className="band-value">
                {Math.round(data.energy * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackAnalysis;