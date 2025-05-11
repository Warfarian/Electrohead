// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS = {
  // Transport Controls
  'left-play': { key: 'q', description: 'Play/Pause Left Deck' },
  'right-play': { key: 'p', description: 'Play/Pause Right Deck' },
  'left-cue': { key: 'w', description: 'Cue Left Deck' },
  'right-cue': { key: 'o', description: 'Cue Right Deck' },
  
  // Volume Controls
  'left-volume-up': { key: 'e', description: 'Increase Left Volume' },
  'left-volume-down': { key: 'd', description: 'Decrease Left Volume' },
  'right-volume-up': { key: 'i', description: 'Increase Right Volume' },
  'right-volume-down': { key: 'k', description: 'Decrease Right Volume' },
  
  // Pitch Controls
  'left-pitch-up': { key: 'r', description: 'Increase Left Pitch' },
  'left-pitch-down': { key: 'f', description: 'Decrease Left Pitch' },
  'right-pitch-up': { key: 'u', description: 'Increase Right Pitch' },
  'right-pitch-down': { key: 'j', description: 'Decrease Right Pitch' },
  
  // Effect Controls
  'left-effect-1': { key: '1', description: 'Left Effect 1' },
  'left-effect-2': { key: '2', description: 'Left Effect 2' },
  'left-effect-3': { key: '3', description: 'Left Effect 3' },
  'left-effect-4': { key: '4', description: 'Left Effect 4' },
  'right-effect-1': { key: '7', description: 'Right Effect 1' },
  'right-effect-2': { key: '8', description: 'Right Effect 2' },
  'right-effect-3': { key: '9', description: 'Right Effect 3' },
  'right-effect-4': { key: '0', description: 'Right Effect 4' },
  
  // Loop Controls
  'left-loop-in': { key: 'a', description: 'Set Left Loop In' },
  'left-loop-out': { key: 's', description: 'Set Left Loop Out' },
  'right-loop-in': { key: 'l', description: 'Set Right Loop In' },
  'right-loop-out': { key: ';', description: 'Set Right Loop Out' },
  
  // Hot Cues
  'left-cue-1': { key: 'z', description: 'Left Hot Cue 1' },
  'left-cue-2': { key: 'x', description: 'Left Hot Cue 2' },
  'left-cue-3': { key: 'c', description: 'Left Hot Cue 3' },
  'left-cue-4': { key: 'v', description: 'Left Hot Cue 4' },
  'right-cue-1': { key: 'm', description: 'Right Hot Cue 1' },
  'right-cue-2': { key: ',', description: 'Right Hot Cue 2' },
  'right-cue-3': { key: '.', description: 'Right Hot Cue 3' },
  'right-cue-4': { key: '/', description: 'Right Hot Cue 4' },
  
  // Sample Pads
  'sample-1': { key: '5', description: 'Trigger Sample 1' },
  'sample-2': { key: '6', description: 'Trigger Sample 2' },
  'sample-3': { key: 't', description: 'Trigger Sample 3' },
  'sample-4': { key: 'y', description: 'Trigger Sample 4' },
  'sample-bank-prev': { key: 'g', description: 'Previous Sample Bank' },
  'sample-bank-next': { key: 'h', description: 'Next Sample Bank' },
  
  // Recording
  'record-toggle': { key: ' ', description: 'Start/Stop Recording' },
  
  // Sync
  'sync-left': { key: 'b', description: 'Sync from Left' },
  'sync-right': { key: 'n', description: 'Sync from Right' }
};

export class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.handlers = new Map();
    this.isLearning = false;
    this.learnCallback = null;
    this.loadShortcuts();
  }

  loadShortcuts() {
    try {
      const stored = localStorage.getItem('keyboardShortcuts');
      if (stored) {
        const shortcuts = JSON.parse(stored);
        Object.entries(shortcuts).forEach(([action, shortcut]) => {
          this.shortcuts.set(action, shortcut);
        });
      } else {
        // Load defaults
        Object.entries(DEFAULT_SHORTCUTS).forEach(([action, shortcut]) => {
          this.shortcuts.set(action, shortcut);
        });
      }
    } catch (error) {
      console.error('Error loading keyboard shortcuts:', error);
    }
  }

  saveShortcuts() {
    try {
      const shortcuts = Object.fromEntries(this.shortcuts);
      localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
    } catch (error) {
      console.error('Error saving keyboard shortcuts:', error);
    }
  }

  startLearning(action, callback) {
    this.isLearning = true;
    this.learnCallback = (key) => {
      const shortcut = { ...this.shortcuts.get(action), key };
      this.shortcuts.set(action, shortcut);
      this.saveShortcuts();
      callback(shortcut);
      this.isLearning = false;
      this.learnCallback = null;
    };
  }

  stopLearning() {
    this.isLearning = false;
    this.learnCallback = null;
  }

  handleKeyDown = (event) => {
    // Ignore if typing in an input
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.isContentEditable) {
      return;
    }

    const key = event.key.toLowerCase();
    
    if (this.isLearning && this.learnCallback) {
      event.preventDefault();
      this.learnCallback(key);
      return;
    }
    
    // Find action for this key
    for (const [action, shortcut] of this.shortcuts.entries()) {
      if (shortcut.key === key) {
        const handler = this.handlers.get(action);
        if (handler) {
          event.preventDefault();
          handler();
        }
        break;
      }
    }
  };

  initialize() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  setHandler(action, handler) {
    this.handlers.set(action, handler);
  }

  removeHandler(action) {
    this.handlers.delete(action);
  }

  getShortcut(action) {
    return this.shortcuts.get(action);
  }

  getAllShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([action, shortcut]) => ({
      action,
      ...shortcut
    }));
  }
}