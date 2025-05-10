import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import crowdGif from './assets/crowd.gif';
import djIdleSprite from './assets/dj-idle.gif';
import djIdleVibeSprite from './assets/dj-idle-vibe-trans.gif';
import djWaveSprite from './assets/dj-wave-trans.gif';
import djCelebSprite from './assets/dj-celeb-trans.gif';

import BackArrow from './components/BackArrow';
import HomePage from './pages/HomePage';
import CrowdplayPage from './pages/CrowdplayPage';
import StrudelPage from './pages/StrudelPage';

function App() {
  const location = useLocation();
  const isWelcomeScreen = location.pathname === '/' && !location.search.includes('showModes=true');
  const isModeSelectionScreen = location.pathname === '/' && location.search.includes('showModes=true');
  const isCrowdplayMode = location.pathname === '/crowdplay';
  const isStrudelMode = location.pathname === '/strudel';

  // Lift state up for vibe meter and crowd reaction
  const [crowdReaction, setCrowdReaction] = useState(null);
  const [djSprite, setDjSprite] = useState(djIdleSprite);

  // Helper function to get DJ sprite based on score
  const getDjSprite = (score) => {
    if (!score) return djIdleSprite;
    if (score >= 8.5) return djCelebSprite;
    if (score >= 7.0) return djWaveSprite;
    if (score >= 5.0) return djIdleVibeSprite;
    return djIdleSprite;
  };

  // Update DJ sprite when crowd reaction changes
  useEffect(() => {
    setDjSprite(getDjSprite(crowdReaction?.score));
  }, [crowdReaction]);

  // Listen for crowd reaction updates from Strudel mode
  useEffect(() => {
    const handleCrowdReactionUpdate = (event) => {
      if (isStrudelMode) {
        setCrowdReaction(event.detail);
      }
    };

    window.addEventListener('crowdReactionUpdate', handleCrowdReactionUpdate);
    return () => {
      window.removeEventListener('crowdReactionUpdate', handleCrowdReactionUpdate);
    };
  }, [isStrudelMode]);

  // Reset DJ sprite when leaving Crowdplay or Strudel mode
  useEffect(() => {
    if (!isCrowdplayMode && !isStrudelMode) {
      setDjSprite(djIdleSprite);
      setCrowdReaction(null);
    }
  }, [isCrowdplayMode, isStrudelMode]);

  // Render vibe meter if we have a crowd reaction
  const renderVibeMeter = () => {
    if (!crowdReaction || (!isCrowdplayMode && !isStrudelMode)) return null;
    
    const score = crowdReaction.score;
    const percentage = (score / 10) * 100;
    
    return (
      <div className="vibe-meter">
        <p className="vibe-meter-label">Crowd Vibe</p>
        <div className="vibe-meter-bar">
          <div 
            className="vibe-meter-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Full-screen crowd background */}
      <div className="crowd-gif-container">
        <img src={crowdGif} alt="Crowd" className="crowd-gif" />
      </div>

      {/* Back Arrow - Show except on welcome screen */}
      {!isWelcomeScreen && <BackArrow />}

      {/* DJ Area - Hide on welcome screen and mode selection screen */}
      {!isWelcomeScreen && !isModeSelectionScreen && (
        <header className="dj-area">
          <img src={djSprite} alt="DJ" className="dj-sprite" />
        </header>
      )}

      {/* Vibe Meter */}
      {renderVibeMeter()}

      {/* Crowd Reaction */}
      {crowdReaction && (isCrowdplayMode || isStrudelMode) && (
        <div className="crowd-reaction">
          <div className="reaction-header">
            <h3>{crowdReaction.reaction}</h3>
          </div>
          <p className="crowd-message">{crowdReaction.message}</p>
        </div>
      )}

      <div className={`game-area-wrapper ${isWelcomeScreen || isModeSelectionScreen ? 'welcome-active' : ''}`}>
        <main className="game-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/crowdplay" 
              element={
                <CrowdplayPage 
                  onCrowdReaction={setCrowdReaction}
                />
              } 
            />
            <Route path="/strudel" element={<StrudelPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
