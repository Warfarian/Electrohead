import React, { useState } from 'react';
import { DEFAULT_SHORTCUTS } from '../utils/shortcuts';

const ShortcutHelp = ({ shortcuts, onLearn }) => {
  const [isLearning, setIsLearning] = useState(false);
  const [learningAction, setLearningAction] = useState(null);

  const handleLearnClick = (action) => {
    if (isLearning && learningAction === action) {
      onLearn(action, null);
      setIsLearning(false);
      setLearningAction(null);
    } else {
      setIsLearning(true);
      setLearningAction(action);
      onLearn(action, (shortcut) => {
        setIsLearning(false);
        setLearningAction(null);
      });
    }
  };

  const formatKey = (key) => {
    switch (key) {
      case ' ': return 'Space';
      case ';': return 'Semicolon';
      case ',': return 'Comma';
      case '.': return 'Period';
      case '/': return 'Slash';
      default: return key.toUpperCase();
    }
  };

  const categories = {
    'Transport': ['left-play', 'right-play', 'left-cue', 'right-cue'],
    'Volume': ['left-volume-up', 'left-volume-down', 'right-volume-up', 'right-volume-down'],
    'Pitch': ['left-pitch-up', 'left-pitch-down', 'right-pitch-up', 'right-pitch-down'],
    'Effects': ['left-effect-1', 'left-effect-2', 'left-effect-3', 'left-effect-4',
                'right-effect-1', 'right-effect-2', 'right-effect-3', 'right-effect-4'],
    'Loops': ['left-loop-in', 'left-loop-out', 'right-loop-in', 'right-loop-out'],
    'Hot Cues': ['left-cue-1', 'left-cue-2', 'left-cue-3', 'left-cue-4',
                 'right-cue-1', 'right-cue-2', 'right-cue-3', 'right-cue-4'],
    'Samples': ['sample-1', 'sample-2', 'sample-3', 'sample-4',
                'sample-bank-prev', 'sample-bank-next'],
    'Recording': ['record-toggle'],
    'Sync': ['sync-left', 'sync-right']
  };

  return (
    <div className="shortcut-help">
      <h4>KEYBOARD SHORTCUTS</h4>
      <div className="shortcut-categories">
        {Object.entries(categories).map(([category, actions]) => (
          <div key={category} className="shortcut-category">
            <h5>{category}</h5>
            <div className="shortcut-list">
              {actions.map(action => {
                const shortcut = shortcuts.get(action) || DEFAULT_SHORTCUTS[action];
                return (
                  <div key={action} className="shortcut-item">
                    <span className="shortcut-description">
                      {shortcut.description}
                    </span>
                    <div className="shortcut-controls">
                      <button
                        className={`shortcut-key ${learningAction === action ? 'learning' : ''}`}
                        onClick={() => handleLearnClick(action)}
                      >
                        {learningAction === action ? 'Press Key...' : formatKey(shortcut.key)}
                      </button>
                      <button
                        className="shortcut-reset"
                        onClick={() => {
                          const defaultShortcut = DEFAULT_SHORTCUTS[action];
                          if (defaultShortcut) {
                            onLearn(action, () => {});
                          }
                        }}
                        title="Reset to Default"
                      >
                        ↺
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortcutHelp;