import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import djDisplaySprite from '../assets/dj-idle-vibe-trans.gif'; // Using as placeholder for dj0idle.gif

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize showModes based on URL query parameter
  const initialShowModes = new URLSearchParams(location.search).get('showModes') === 'true';
  const [showModes, setShowModes] = useState(initialShowModes);

  // Effect to update showModes if the URL query parameter changes
  useEffect(() => {
    const queryShowModes = new URLSearchParams(location.search).get('showModes') === 'true';
    if (queryShowModes !== showModes) {
      setShowModes(queryShowModes);
    }
  }, [location.search, showModes]);

  const handlePlay = () => {
    setShowModes(true);
    navigate('/?showModes=true');
  };

  return (
    <div className="home-content">
      {!showModes ? (
        <div className="welcome-screen">
          <h1>DJ ELECTROHEAD</h1>
          <img src={djDisplaySprite} alt="DJ" className="welcome-dj" />
          <button 
            className="action-button"
            onClick={handlePlay}
          >
            PLAY
          </button>
        </div>
      ) : (
        <div className="mode-selection">
          <h2>SELECT MODE</h2>
          <div className="mode-buttons">
            <div className="mode-button-container">
              <Link to="/crowdplay" className="mode-button">
                CROWDPLAY MODE
              </Link>
              <div className="mode-description">
                Play songs using Spotify. The AI crowd rates your vibe based on
                how well each track maintains energy and flow.
              </div>
            </div>
            <div className="mode-button-container">
              <Link to="/strudel" className="mode-button">
                STRUDEL MODE
              </Link>
              <div className="mode-description">
                Build a mix live by combining musical loops. AI scores your
                creativity and rhythm.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;