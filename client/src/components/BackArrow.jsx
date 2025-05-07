import { useNavigate, useLocation } from 'react-router-dom';

const BackArrow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    if (location.pathname === '/' && location.search.includes('showModes=true')) {
      navigate('/');
    } else {
      navigate('/?showModes=true');
    }
  };

  return (
    <button 
      className="back-arrow"
      onClick={handleBack}
    >
      ← BACK
    </button>
  );
};

export default BackArrow;