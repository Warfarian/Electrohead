import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import crowdGif from './assets/crowd.gif';
import djDisplaySprite from './assets/dj-idle-vibe-trans.gif';

import BackArrow from './components/BackArrow';
import HomePage from './pages/HomePage';
import CrowdplayPage from './pages/CrowdplayPage';
import StrudelPage from './pages/StrudelPage';

function App() {
  const location = useLocation();
  const isWelcomeScreen = location.pathname === '/' && !location.search.includes('showModes=true');
  const isModeSelectionScreen = location.pathname === '/' && location.search.includes('showModes=true');

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
          <img src={djDisplaySprite} alt="DJ" className="dj-sprite" />
        </header>
      )}

      <div className={`game-area-wrapper ${isWelcomeScreen || isModeSelectionScreen ? 'welcome-active' : ''}`}>
        <main className="game-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/crowdplay" element={<CrowdplayPage />} />
            <Route path="/strudel" element={<StrudelPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
