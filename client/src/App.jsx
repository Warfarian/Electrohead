import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import crowdGif from './assets/crowd.gif';
import djIdleGif from './assets/dj-idle-vibe-trans.gif';
import djWaveGif from './assets/dj-wave-trans.gif';
import djCelebGif from './assets/dj-celeb-trans.gif';

import BackArrow from './components/BackArrow';
import HomePage from './pages/HomePage';
import CrowdplayPage from './pages/CrowdplayPage';
import StrudelPage from './pages/StrudelPage';
import MixingPage from './pages/MixingPage';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isWelcomeScreen = location.pathname === '/' && !location.search.includes('showModes=true');
  const isModeSelectionScreen = location.pathname === '/' && location.search.includes('showModes=true');
  const isCrowdplayMode = location.pathname === '/crowdplay';
  const isStrudelMode = location.pathname === '/strudel';
  const isMixingMode = location.pathname === '/mixing';

  // Add state for menu expansion
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // Lift state up for vibe meter and crowd reaction
  const [crowdReaction, setCrowdReaction] = useState(null);
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem('currentScore');
    return savedScore ? parseInt(savedScore, 10) : 0;
  });
  const [previousScore, setPreviousScore] = useState(0);

  // Update score when crowd reaction changes
  useEffect(() => {
    if (crowdReaction?.score) {
      const currentScore = crowdReaction.score;
      const scoreDiff = Math.round((currentScore - previousScore) * 100);
      
      if (scoreDiff !== 0) { // Only update if there's a change
        setScore(prevScore => {
          const newScore = Math.max(0, prevScore + scoreDiff);
          localStorage.setItem('currentScore', newScore.toString());
          return newScore;
        });
      }
      
      setPreviousScore(currentScore);
    }
  }, [crowdReaction?.score, previousScore]);

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

  // Reset crowd reaction when leaving Crowdplay or Strudel mode
  useEffect(() => {
    if (!isCrowdplayMode && !isStrudelMode) {
      setCrowdReaction(null);
    }
  }, [isCrowdplayMode, isStrudelMode]);

  const handleEndGame = () => {
    const finalScore = score;
    const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    
    // Add new score with timestamp and mode
    highScores.push({
      score: finalScore,
      date: new Date().toISOString(),
      mode: isStrudelMode ? 'Strudel' : 'Crowdplay'
    });
    
    // Sort high scores and keep top 10
    highScores.sort((a, b) => b.score - a.score);
    const topScores = highScores.slice(0, 10);
    
    // Save high scores and clean up current score
    localStorage.setItem('highScores', JSON.stringify(topScores));
    localStorage.removeItem('currentScore');
    
    // Show final score alert
    alert(`Game Over!\nFinal Score: ${finalScore}`);
    
    // Reset states
    setScore(0);
    setPreviousScore(0);
    setCrowdReaction(null);
    setIsMenuExpanded(false);
    
    // Navigate to home
    navigate('/');
  };

  // Render vibe meter if we have a crowd reaction
  const renderVibeMeter = () => {
    if (!crowdReaction || (!isCrowdplayMode && !isStrudelMode)) return null;
    
    const currentScore = crowdReaction.score;
    const percentage = (currentScore / 10) * 100;
    
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

  // Get current DJ animation based on vibe score
  const getDjAnimation = () => {
    if (!crowdReaction?.score) return djIdleGif;
    const score = crowdReaction.score;
    if (score >= 8) return djCelebGif;
    if (score >= 5) return djWaveGif;
    return djIdleGif;
  };

  return (
    <div className="app-container">
      {/* Full-screen crowd background */}
      <div className="crowd-gif-container">
        <img src={crowdGif} alt="Crowd" className="crowd-gif" />
      </div>

      {/* DJ Animation Container - Show except on welcome screen */}
      {!isWelcomeScreen && (isCrowdplayMode || isStrudelMode || isMixingMode) && (
        <div className="dj-container">
          <img 
            src={getDjAnimation()} 
            alt="DJ" 
            className="dj-animation"
          />
        </div>
      )}

      {/* Back Arrow and Game Controls - Show except on welcome screen */}
      {!isWelcomeScreen && (
        <div className="game-controls">
          <BackArrow />
          {(isCrowdplayMode || isStrudelMode) && (
            <>
              <button 
                className="menu-toggle"
                onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                aria-label={isMenuExpanded ? "Hide menu" : "Show menu"}
              >
                {isMenuExpanded ? "×" : "☰"}
              </button>
              <div className={`game-controls-group ${isMenuExpanded ? 'expanded' : ''}`}>
                <div className="current-score">Score: {score}</div>
                <button onClick={handleEndGame} className="end-game-button">
                  END
                </button>
              </div>
            </>
          )}
        </div>
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
            <Route 
              path="/mixing" 
              element={
                <MixingPage 
                  onCrowdReaction={setCrowdReaction}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
