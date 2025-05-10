import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { handleRedirect } from '../utils/spotify';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [highScores, setHighScores] = useState([]);
  
  // Initialize showModes based on URL query parameter
  const initialShowModes = new URLSearchParams(location.search).get('showModes') === 'true';
  const [showModes, setShowModes] = useState(initialShowModes);

  // Load high scores
  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('highScores') || '[]');
    setHighScores(scores);
  }, []);

  // Effect to handle Spotify redirect
  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    
    if (code) {
      setIsLoading(true);
      handleRedirect()
        .then(token => {
          if (!mounted) return;
          if (token) {
            navigate('/crowdplay');
          } else {
            console.error('Authentication failed');
          }
        })
        .catch(error => {
          if (!mounted) return;
          console.error('Auth error:', error);
        })
        .finally(() => {
          if (!mounted) return;
          setIsLoading(false);
          setInitialLoading(false);
        });
    } else {
      // Turn off initial loading after a short delay
      // This prevents a flash of content during quick loads
      const timer = setTimeout(() => {
        if (mounted) {
          setInitialLoading(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      mounted = false;
    };
  }, [location.search, navigate]);

  // Effect to update showModes if the URL query parameter changes
  useEffect(() => {
    const queryShowModes = new URLSearchParams(location.search).get('showModes') === 'true';
    if (queryShowModes !== showModes) {
      setShowModes(queryShowModes);
    }
  }, [location.search, showModes]);

  const handlePlay = () => {
    setIsLoading(true);
    setShowModes(true);
    navigate('/?showModes=true');
    // Reset loading after navigation
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  };

  const handleModeSelect = (mode) => {
    setNavigatingTo(mode);
    // Reset after navigation
    const timer = setTimeout(() => setNavigatingTo(''), 100);
    return () => clearTimeout(timer);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state while checking auth
  if (initialLoading) {
    return (
      <div className="home-content">
        <div className="loading-results">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-content">
      {!showModes ? (
        <div className="welcome-screen">
          <h1>
            <span>DJ</span>
            <span>ELECTROHEAD</span>
          </h1>
          
          {/* How to Play Section */}
          <div className="how-to-play">
            <h2>HOW TO PLAY</h2>
            <div className="instruction-list">
              <div className="instruction-item">
                <span className="instruction-number">1UP</span>
                <span className="instruction-text">Choose your mode: CROWDPLAY or STRUDEL</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">2UP</span>
                <span className="instruction-text">Keep the crowd hyped with perfect track selection</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">3UP</span>
                <span className="instruction-text">Watch the vibe meter and adjust your strategy</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">BONUS</span>
                <span className="instruction-text">Chain similar vibes for combo multipliers!</span>
              </div>
            </div>
          </div>

          <button 
            className="action-button"
            onClick={handlePlay}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : 'PRESS START'}
          </button>

          {/* Game Features Section */}
          <div className="game-features">
            <h2>FEATURES</h2>
            <div className="feature-grid">
              <div className="feature-item">
                <div className="feature-icon">🎵</div>
                <div className="feature-title">AI DJ CROWD</div>
                <div className="feature-description">Smart crowd reactions to your music choices</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎮</div>
                <div className="feature-title">DUAL MODES</div>
                <div className="feature-description">Spotify mixing or live beat creation</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-title">VIBE METER</div>
                <div className="feature-description">Real-time crowd energy tracking</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <div className="feature-title">SCORE SYSTEM</div>
                <div className="feature-description">Compete for the highest DJ score</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mode-selection">
          <h2>SELECT MODE</h2>
          <div className="mode-buttons">
            <div className="mode-button-container">
              <Link 
                to="/crowdplay" 
                className="mode-button"
                tabIndex={isLoading ? -1 : 0}
                style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                onClick={() => handleModeSelect('crowdplay')}
              >
                {navigatingTo === 'crowdplay' ? <LoadingSpinner /> : 'CROWDPLAY MODE'}
              </Link>
              <div className="mode-description">
                Play songs using Spotify. The AI crowd rates your vibe based on
                how well each track maintains energy and flow.
              </div>
            </div>
            <div className="mode-button-container">
              <Link 
                to="/strudel" 
                className="mode-button"
                tabIndex={isLoading ? -1 : 0}
                style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                onClick={() => handleModeSelect('strudel')}
              >
                {navigatingTo === 'strudel' ? <LoadingSpinner /> : 'STRUDEL MODE'}
              </Link>
              <div className="mode-description">
                Build a mix live by combining musical loops. AI scores your
                creativity and rhythm.
              </div>
            </div>
          </div>

          {/* High Scores Section - Moved here */}
          {highScores.length > 0 && (
            <div className="high-scores">
              <h2>HIGH SCORES</h2>
              <div className="scores-list">
                {highScores.map((score, index) => (
                  <div key={index} className="score-item">
                    <span className="score-rank">#{index + 1}</span>
                    <span className="score-points">{score.score}</span>
                    <span className="score-mode">{score.mode}</span>
                    <span className="score-date">{formatDate(score.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;