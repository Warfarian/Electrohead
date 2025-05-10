import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

const BackArrow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleBack = useCallback(() => {
    let mounted = true;
    setIsLoading(true);
    
    if (location.pathname === '/' && location.search.includes('showModes=true')) {
      navigate('/');
    } else {
      navigate('/?showModes=true');
    }

    // Reset loading after navigation
    const timer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [location.pathname, location.search, navigate]);

  return (
    <button 
      className="back-arrow"
      onClick={handleBack}
      disabled={isLoading}
    >
      {isLoading ? <LoadingSpinner /> : (
        <span className="back-arrow-content">
          <span className="back-arrow-symbol">←</span>
          <span className="back-arrow-text">BACK</span>
        </span>
      )}
    </button>
  );
};

export default BackArrow;