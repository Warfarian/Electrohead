import React, { useState, useEffect } from 'react';

const MIDILearn = ({ midi, control, onMapped }) => {
  const [isLearning, setIsLearning] = useState(false);
  const [mapping, setMapping] = useState(null);

  useEffect(() => {
    const currentMapping = midi?.mappings.get(control);
    setMapping(currentMapping);
  }, [midi, control]);

  const handleLearnClick = () => {
    if (!midi) return;
    
    if (isLearning) {
      midi.stopLearning();
      setIsLearning(false);
    } else {
      setIsLearning(true);
      midi.startLearning(control, (newMapping) => {
        setMapping(newMapping);
        setIsLearning(false);
        if (onMapped) onMapped(newMapping);
      });
    }
  };

  const formatMapping = (m) => {
    if (!m) return 'Not mapped';
    return m.type === 'cc' ? 
      `CC ${m.control}` : 
      `Note ${m.note}`;
  };

  return (
    <div className="midi-learn">
      <button
        className={`midi-learn-button ${isLearning ? 'learning' : ''}`}
        onClick={handleLearnClick}
        disabled={!midi}
      >
        {isLearning ? 'Cancel' : 'Learn'}
      </button>
      <span className="midi-mapping">
        {formatMapping(mapping)}
      </span>
    </div>
  );
};

export default MIDILearn;