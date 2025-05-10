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
  
  // Initialize showModes based on URL query parameter
  const initialShowModes = new URLSearchParams(location.search).get('showModes') === 'true';
  const [showModes, setShowModes] = useState(initialShowModes);

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
          <h1>DJ ELECTROHEAD</h1>
          <button 
            className="action-button"
            onClick={handlePlay}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : 'PLAY'}
          </button>
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
        </div>
      )}
    </div>
  );
};

export default HomePage;