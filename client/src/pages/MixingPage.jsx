import React, { useState, useEffect, useRef } from 'react';
import { 
  initAudio, 
  loadAudio, 
  createGain,
  createEQ,
  createFilter,
  createEffects,
  createBeatEffects
} from '../utils/mixer';
import { getCrowdReaction } from '../utils/crowd';

import EQControls from '../components/EQControls';
import EffectsControls from '../components/EffectsControls';
import FilterControl from '../components/FilterControl';
import BeatEffects from '../components/BeatEffects';
import TrackOverview from '../components/TrackOverview';
import KeyDisplay from '../components/KeyDisplay';
import SamplePad from '../components/SamplePad';

// Import DJ GIFs
import djIdleGif from '../assets/dj-idle-vibe-trans.gif';
import djCelebGif from '../assets/dj-celeb-trans.gif';
import djWaveGif from '../assets/dj-wave-trans.gif';

const MixingPage = ({ onCrowdReaction }) => {
  const [leftTrack, setLeftTrack] = useState(null);
  const [rightTrack, setRightTrack] = useState(null);
  const [crossfaderValue, setCrossfaderValue] = useState(50);
  const [leftVolume, setLeftVolume] = useState(75);
  const [rightVolume, setRightVolume] = useState(75);
  const [leftPlaying, setLeftPlaying] = useState(false);
  const [rightPlaying, setRightPlaying] = useState(false);
  const [vibeScore, setVibeScore] = useState(5);
  const [crowdMessage, setCrowdMessage] = useState('');
  const lastMixActionRef = useRef(Date.now());

  // Reset crowd reaction when component unmounts
  useEffect(() => {
    return () => {
      onCrowdReaction(null);
    };
  }, [onCrowdReaction]);

  // Audio nodes
  const audioNodesRef = useRef({
    leftGain: null,
    rightGain: null,
    leftEQ: null,
    rightEQ: null,
    leftFilter: null,
    rightFilter: null,
    leftEffects: null,
    rightEffects: null,
    leftBeatEffects: null,
    rightBeatEffects: null,
    context: null
  });

  // Track analysis data
  const [leftAnalysis, setLeftAnalysis] = useState(null);
  const [rightAnalysis, setRightAnalysis] = useState(null);

  // Initialize audio context
  useEffect(() => {
    const audio = initAudio();
    audioNodesRef.current.context = audio.context;
  }, []);

  // Handle file upload
  const handleFileUpload = async (event, deck) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const source = await loadAudio(file);
      const gain = createGain();
      const eq = createEQ();
      const filter = createFilter();
      const effects = createEffects();
      const beatEffects = createBeatEffects();

      // Connect nodes
      source.connect(eq.low);
      eq.low.connect(eq.mid);
      eq.mid.connect(eq.high);
      eq.high.connect(filter);
      filter.connect(effects.delay);
      effects.delay.connect(effects.delayGain);
      effects.delayGain.connect(gain);
      filter.connect(effects.reverbGain);
      effects.reverbGain.connect(gain);
      filter.connect(beatEffects.flangerGain);
      beatEffects.flangerGain.connect(gain);
      filter.connect(beatEffects.phaserGain);
      beatEffects.phaserGain.connect(gain);
      filter.connect(gain);
      gain.connect(audioNodesRef.current.context.destination);

      // Store nodes and update state
      if (deck === 'left') {
        audioNodesRef.current.leftGain = gain;
        audioNodesRef.current.leftEQ = eq;
        audioNodesRef.current.leftFilter = filter;
        audioNodesRef.current.leftEffects = effects;
        audioNodesRef.current.leftBeatEffects = beatEffects;
        gain.gain.value = leftVolume / 100;
        setLeftTrack({ source, file: file.name, buffer: source.buffer });
        setLeftPlaying(true);

        // Analyze track
        const analysis = {
          bpm: 128, // Mock BPM detection
          key: 'Am',
          duration: source.buffer.duration
        };
        setLeftAnalysis(analysis);
      } else {
        audioNodesRef.current.rightGain = gain;
        audioNodesRef.current.rightEQ = eq;
        audioNodesRef.current.rightFilter = filter;
        audioNodesRef.current.rightEffects = effects;
        audioNodesRef.current.rightBeatEffects = beatEffects;
        gain.gain.value = rightVolume / 100;
        setRightTrack({ source, file: file.name, buffer: source.buffer });
        setRightPlaying(true);

        // Analyze track
        const analysis = {
          bpm: 130, // Mock BPM detection
          key: 'Cm',
          duration: source.buffer.duration
        };
        setRightAnalysis(analysis);
      }

      source.start(0);

      // Get crowd reaction when both tracks are loaded
      if (leftTrack && deck === 'right' || rightTrack && deck === 'left') {
        const reaction = await getCrowdReaction(
          { 
            name: file.name,
            artists: [{ name: 'Unknown Artist' }],
            uri: 'local:' + file.name 
          },
          deck === 'left' ? 
            { 
              name: rightTrack.file,
              artists: [{ name: 'Unknown Artist' }],
              uri: 'local:' + rightTrack.file 
            } : 
            { 
              name: leftTrack.file,
              artists: [{ name: 'Unknown Artist' }],
              uri: 'local:' + leftTrack.file 
            }
        );
        
        // Update vibe score and notify parent
        if (reaction) {
          setVibeScore(reaction.score);
          setCrowdMessage(reaction.message || 'The crowd is feeling it!');
          onCrowdReaction(reaction);
        }
      }
    } catch (error) {
      console.error('Error loading track:', error);
    }
  };

  // Handle play/pause
  const handlePlayPause = (deck) => {
    if (deck === 'left') {
      if (leftTrack?.source) {
        if (leftPlaying) {
          try {
            leftTrack.source.stop();
            setLeftPlaying(false);
          } catch (error) {
            console.error('Error stopping track:', error);
          }
        } else {
          try {
            // Create and connect new source
            const newSource = audioNodesRef.current.context.createBufferSource();
            newSource.buffer = leftTrack.buffer;
            newSource.connect(audioNodesRef.current.leftEQ.low);
            newSource.start(0);
            setLeftTrack({ ...leftTrack, source: newSource });
            setLeftPlaying(true);

            // Trigger crowd reaction
            if (rightTrack) {
              triggerCrowdReaction();
            }
          } catch (error) {
            console.error('Error starting track:', error);
          }
        }
      }
    } else {
      if (rightTrack?.source) {
        if (rightPlaying) {
          try {
            rightTrack.source.stop();
            setRightPlaying(false);
          } catch (error) {
            console.error('Error stopping track:', error);
          }
        } else {
          try {
            // Create and connect new source
            const newSource = audioNodesRef.current.context.createBufferSource();
            newSource.buffer = rightTrack.buffer;
            newSource.connect(audioNodesRef.current.rightEQ.low);
            newSource.start(0);
            setRightTrack({ ...rightTrack, source: newSource });
            setRightPlaying(true);

            // Trigger crowd reaction
            if (leftTrack) {
              triggerCrowdReaction();
            }
          } catch (error) {
            console.error('Error starting track:', error);
          }
        }
      }
    }
  };

  // Trigger crowd reaction
  const triggerCrowdReaction = async () => {
    if (!leftTrack || !rightTrack) return;

    const now = Date.now();
    if (now - lastMixActionRef.current > 2000) {
      lastMixActionRef.current = now;
      
      try {
        const reaction = await getCrowdReaction(
          { 
            name: leftTrack.file,
            artists: [{ name: 'Unknown Artist' }],
            uri: 'local:' + leftTrack.file 
          },
          { 
            name: rightTrack.file,
            artists: [{ name: 'Unknown Artist' }],
            uri: 'local:' + rightTrack.file 
          }
        );
        
        if (reaction) {
          setVibeScore(reaction.score);
          setCrowdMessage(reaction.message || 'The crowd is feeling it!');
          onCrowdReaction(reaction);
        } else {
          setVibeScore(5);
          setCrowdMessage('The crowd is vibing to the technical difficulties!');
        }
      } catch (error) {
        console.error('Error getting crowd reaction:', error);
      }
    }
  };

  // Handle volume changes
  const handleVolumeChange = (deck, value) => {
    if (deck === 'left') {
      setLeftVolume(value);
      if (audioNodesRef.current.leftGain) {
        audioNodesRef.current.leftGain.gain.value = value / 100;
      }
    } else {
      setRightVolume(value);
      if (audioNodesRef.current.rightGain) {
        audioNodesRef.current.rightGain.gain.value = value / 100;
      }
    }
  };

  // Enhanced crossfader with crowd reaction
  const handleCrossfader = async (value) => {
    setCrossfaderValue(value);
    const leftGain = (100 - value) / 100;
    const rightGain = value / 100;
    
    if (audioNodesRef.current.leftGain) {
      audioNodesRef.current.leftGain.gain.value = leftGain * (leftVolume / 100);
    }
    if (audioNodesRef.current.rightGain) {
      audioNodesRef.current.rightGain.gain.value = rightGain * (rightVolume / 100);
    }

    // Only trigger crowd reaction if both tracks are loaded and at least one is playing
    if (leftTrack && rightTrack && (leftPlaying || rightPlaying)) {
      triggerCrowdReaction();
    }
  };

  return (
    <div className="mixing-page">
      {/* Status Area */}
      <div className="status-area">
        {/* Vibe Meter */}
        <div className="vibe-meter">
          <div className="vibe-meter-label">Crowd Vibe</div>
          <div className="vibe-meter-bar">
            <div 
              className="vibe-meter-fill" 
              style={{ width: `${(vibeScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Crowd Reaction */}
        {crowdMessage && (
          <div className="crowd-reaction">
            <div className="reaction-header">
              <h3>Crowd Reaction</h3>
              <div className="score">{vibeScore}/10</div>
            </div>
            <p className="crowd-message">{crowdMessage}</p>
          </div>
        )}
      </div>

      <div className="mixing-console">
        {/* Left Deck */}
        <div className="deck left-deck">
          <h3>Deck A</h3>
          <div className="deck-controls">
            <input 
              type="file" 
              accept="audio/*" 
              onChange={(e) => handleFileUpload(e, 'left')}
              className="file-input"
            />
            <div className="track-info">
              {leftTrack && (
                <p className="track-name">{leftTrack.file}</p>
              )}
            </div>
            {leftTrack?.buffer && (
              <TrackOverview
                audioBuffer={leftTrack.buffer}
                currentTime={0}
                duration={leftAnalysis?.duration}
                bpm={leftAnalysis?.bpm}
                color="#646cff"
              />
            )}
            <div className="transport-controls">
              <button 
                className="transport-button"
                onClick={() => handlePlayPause('left')}
                disabled={!leftTrack}
              >
                {leftPlaying ? '⏸' : '▶'}
              </button>
            </div>
            <KeyDisplay
              musicalKey={leftAnalysis?.key}
              compatibility={rightAnalysis?.key ? "Compatible" : null}
            />
            <div className="volume-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={leftVolume}
                onChange={(e) => handleVolumeChange('left', Number(e.target.value))}
                className="volume-slider-vertical"
              />
            </div>
            <EQControls
              eq={audioNodesRef.current.leftEQ}
              disabled={!leftTrack}
            />
            <FilterControl
              filter={audioNodesRef.current.leftFilter}
              disabled={!leftTrack}
            />
            <EffectsControls
              effects={audioNodesRef.current.leftEffects}
              disabled={!leftTrack}
            />
            <BeatEffects
              effects={audioNodesRef.current.leftBeatEffects}
              disabled={!leftTrack}
            />
          </div>
        </div>

        {/* Mixer Section */}
        <div className="mixer-section">
          <SamplePad />
          <div className="crossfader-container">
            <input
              type="range"
              min="0"
              max="100"
              value={crossfaderValue}
              onChange={(e) => handleCrossfader(Number(e.target.value))}
              className="crossfader"
            />
          </div>
        </div>

        {/* Right Deck */}
        <div className="deck right-deck">
          <h3>Deck B</h3>
          <div className="deck-controls">
            <input 
              type="file" 
              accept="audio/*" 
              onChange={(e) => handleFileUpload(e, 'right')}
              className="file-input"
            />
            <div className="track-info">
              {rightTrack && (
                <p className="track-name">{rightTrack.file}</p>
              )}
            </div>
            {rightTrack?.buffer && (
              <TrackOverview
                audioBuffer={rightTrack.buffer}
                currentTime={0}
                duration={rightAnalysis?.duration}
                bpm={rightAnalysis?.bpm}
                color="#646cff"
              />
            )}
            <div className="transport-controls">
              <button 
                className="transport-button"
                onClick={() => handlePlayPause('right')}
                disabled={!rightTrack}
              >
                {rightPlaying ? '⏸' : '▶'}
              </button>
            </div>
            <KeyDisplay
              musicalKey={rightAnalysis?.key}
              compatibility={leftAnalysis?.key ? "Compatible" : null}
            />
            <div className="volume-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={rightVolume}
                onChange={(e) => handleVolumeChange('right', Number(e.target.value))}
                className="volume-slider-vertical"
              />
            </div>
            <EQControls
              eq={audioNodesRef.current.rightEQ}
              disabled={!rightTrack}
            />
            <FilterControl
              filter={audioNodesRef.current.rightFilter}
              disabled={!rightTrack}
            />
            <EffectsControls
              effects={audioNodesRef.current.rightEffects}
              disabled={!rightTrack}
            />
            <BeatEffects
              effects={audioNodesRef.current.rightBeatEffects}
              disabled={!rightTrack}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixingPage;