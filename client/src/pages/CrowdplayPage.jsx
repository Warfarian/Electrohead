import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUrl, handleRedirect, searchTracks, playTrack, initializeApi, logout } from '../utils/spotify';
import LoadingSpinner from '../components/LoadingSpinner';

const CrowdplayPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    auth: false,
    search: false,
    playback: null, // track ID or null
    logout: false,
    initial: true // Add initial loading state
  });

  useEffect(() => {
    let mounted = true;
    // Check for redirect response
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      setLoadingStates(prev => ({ ...prev, auth: true }));
      handleRedirect()
        .then(token => {
          if (!mounted) return;
          if (token) {
            setIsAuthenticated(true);
          } else {
            // Redirect to home if auth failed
            navigate('/');
          }
        })
        .catch(error => {
          if (!mounted) return;
          console.error('Auth error:', error);
          navigate('/');
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingStates(prev => ({ ...prev, auth: false, initial: false }));
        });
    } else {
      // Check if we have a valid token
      const token = localStorage.getItem('spotify_access_token');
      const expiry = localStorage.getItem('spotify_token_expiry');
      if (token && Date.now() < Number(expiry)) {
        // Initialize the API with the stored token
        if (initializeApi()) {
          setIsAuthenticated(true);
        }
      }
      // Always turn off initial loading after token check
      const timer = setTimeout(() => {
        if (mounted) {
          setLoadingStates(prev => ({ ...prev, initial: false }));
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Show loading state while checking authentication
  if (loadingStates.initial) {
    return (
      <div className="crowdplay-container">
        <div className="loading-results">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, auth: true }));
      const authUrl = await getAuthUrl();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error('Failed to generate auth URL');
      }
    } catch (error) {
      console.error('Failed to generate auth URL:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, auth: false }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setError(null);
      setLoadingStates(prev => ({ ...prev, search: true }));
      const tracks = await searchTracks(searchQuery);
      setSearchResults(tracks);
    } catch (error) {
      console.error('Search failed:', error);
      // If the error is due to authentication, redirect to login
      if (error.message === 'Not authenticated') {
        setIsAuthenticated(false);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, search: false }));
    }
  };

  const handlePlay = async (track) => {
    try {
      setError(null);
      setLoadingStates(prev => ({ ...prev, playback: track.id }));
      await playTrack(track.uri);
      setCurrentTrack(track);
    } catch (error) {
      console.error('Playback failed:', error);
      if (error.message === 'Not authenticated') {
        setIsAuthenticated(false);
      } else if (error.message.includes('No active Spotify device found')) {
        setError('Please open Spotify on your device and play any song first. Once Spotify is active, you can control playback from here.');
      } else {
        setError('Failed to play track. Please try again.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, playback: null }));
    }
  };

  const handleLogout = () => {
    setLoadingStates(prev => ({ ...prev, logout: true }));
    logout();
    setIsAuthenticated(false);
    setSearchResults([]);
    setCurrentTrack(null);
    setError(null);
    // Reset loading after a short delay
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, logout: false }));
    }, 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="crowdplay-container">
        <h2>Crowdplay Mode</h2>
        <p>Connect with Spotify to start playing!</p>
        <button 
          onClick={handleLogin} 
          className="action-button"
          disabled={loadingStates.auth}
        >
          {loadingStates.auth ? <LoadingSpinner /> : 'Connect Spotify'}
        </button>
      </div>
    );
  }

  return (
    <div className="crowdplay-container">
      <h2>Crowdplay Mode</h2>
      
      <div className="header-actions">
        <button 
          onClick={handleLogout} 
          className="logout-button"
          disabled={loadingStates.logout}
        >
          {loadingStates.logout ? <LoadingSpinner /> : 'Disconnect Spotify'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for tracks..."
          className="search-input"
          disabled={loadingStates.search}
        />
        <button 
          type="submit" 
          className="action-button"
          disabled={loadingStates.search}
        >
          {loadingStates.search ? <LoadingSpinner /> : 'Search'}
        </button>
      </form>

      {/* Current Track */}
      {currentTrack && (
        <div className="current-track">
          <h3>Now Playing</h3>
          <p>{currentTrack.name} - {currentTrack.artists[0].name}</p>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results">
        {loadingStates.search ? (
          <div className="loading-results">
            <LoadingSpinner />
            <p>Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((track) => (
            <div key={track.id} className="track-item">
              <div className="track-info">
                <strong>{track.name}</strong>
                <span>{track.artists[0].name}</span>
              </div>
              <button 
                onClick={() => handlePlay(track)}
                className="play-button"
                disabled={loadingStates.playback === track.id}
              >
                {loadingStates.playback === track.id ? <LoadingSpinner /> : 'Play'}
              </button>
            </div>
          ))
        ) : searchQuery.trim() ? (
          <div className="no-results">
            No tracks found for "{searchQuery}"
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CrowdplayPage;