// MIDI message types
export const MIDI_MESSAGE_TYPES = {
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  CONTROL_CHANGE: 0xB0
};

// Default MIDI mappings
export const DEFAULT_MAPPINGS = {
  // Deck A
  'left-play': { type: 'note', note: 0x3B },
  'left-cue': { type: 'note', note: 0x33 },
  'left-volume': { type: 'cc', control: 0x07 },
  'left-pitch': { type: 'cc', control: 0x0D },
  'left-filter': { type: 'cc', control: 0x0E },
  'left-eq-low': { type: 'cc', control: 0x0F },
  'left-eq-mid': { type: 'cc', control: 0x10 },
  'left-eq-high': { type: 'cc', control: 0x11 },
  
  // Deck B
  'right-play': { type: 'note', note: 0x3C },
  'right-cue': { type: 'note', note: 0x34 },
  'right-volume': { type: 'cc', control: 0x08 },
  'right-pitch': { type: 'cc', control: 0x0E },
  'right-filter': { type: 'cc', control: 0x0F },
  'right-eq-low': { type: 'cc', control: 0x12 },
  'right-eq-mid': { type: 'cc', control: 0x13 },
  'right-eq-high': { type: 'cc', control: 0x14 },
  
  // Mixer
  'crossfader': { type: 'cc', control: 0x0B }
};

export class MIDIManager {
  constructor() {
    this.input = null;
    this.output = null;
    this.mappings = new Map();
    this.handlers = new Map();
    this.isLearning = false;
    this.learnCallback = null;
    this.loadMappings();
  }

  async initialize() {
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('WebMIDI not supported');
      }

      const midi = await navigator.requestMIDIAccess();
      
      // Get first available input and output
      const inputs = Array.from(midi.inputs.values());
      const outputs = Array.from(midi.outputs.values());
      
      if (inputs.length > 0) {
        this.input = inputs[0];
        this.input.onmidimessage = (msg) => this.handleMIDIMessage(msg);
      }
      
      if (outputs.length > 0) {
        this.output = outputs[0];
      }
      
      return {
        inputs: inputs.map(i => ({ id: i.id, name: i.name })),
        outputs: outputs.map(o => ({ id: o.id, name: o.name }))
      };
    } catch (error) {
      console.error('MIDI initialization failed:', error);
      return null;
    }
  }

  loadMappings() {
    try {
      const stored = localStorage.getItem('midiMappings');
      if (stored) {
        const mappings = JSON.parse(stored);
        Object.entries(mappings).forEach(([control, mapping]) => {
          this.mappings.set(control, mapping);
        });
      } else {
        // Load defaults
        Object.entries(DEFAULT_MAPPINGS).forEach(([control, mapping]) => {
          this.mappings.set(control, mapping);
        });
      }
    } catch (error) {
      console.error('Error loading MIDI mappings:', error);
    }
  }

  saveMappings() {
    try {
      const mappings = Object.fromEntries(this.mappings);
      localStorage.setItem('midiMappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('Error saving MIDI mappings:', error);
    }
  }

  startLearning(control, callback) {
    this.isLearning = true;
    this.learnCallback = (mapping) => {
      this.mappings.set(control, mapping);
      this.saveMappings();
      callback(mapping);
      this.isLearning = false;
      this.learnCallback = null;
    };
  }

  stopLearning() {
    this.isLearning = false;
    this.learnCallback = null;
  }

  handleMIDIMessage(message) {
    const [status, data1, data2] = message.data;
    const type = status & 0xF0;
    
    if (this.isLearning && this.learnCallback) {
      // Create mapping based on received message
      const mapping = type === MIDI_MESSAGE_TYPES.CONTROL_CHANGE ?
        { type: 'cc', control: data1 } :
        { type: 'note', note: data1 };
      
      this.learnCallback(mapping);
      return;
    }
    
    // Find control for this message
    for (const [control, mapping] of this.mappings.entries()) {
      if (
        (mapping.type === 'cc' && 
         type === MIDI_MESSAGE_TYPES.CONTROL_CHANGE && 
         mapping.control === data1) ||
        (mapping.type === 'note' && 
         (type === MIDI_MESSAGE_TYPES.NOTE_ON || type === MIDI_MESSAGE_TYPES.NOTE_OFF) && 
         mapping.note === data1)
      ) {
        const handler = this.handlers.get(control);
        if (handler) {
          if (mapping.type === 'cc') {
            handler(data2 / 127); // Normalize to 0-1
          } else {
            handler(type === MIDI_MESSAGE_TYPES.NOTE_ON && data2 > 0);
          }
        }
        break;
      }
    }
  }

  setHandler(control, handler) {
    this.handlers.set(control, handler);
  }

  removeHandler(control) {
    this.handlers.delete(control);
  }

  sendFeedback(control, value) {
    if (!this.output) return;
    
    const mapping = this.mappings.get(control);
    if (!mapping) return;
    
    if (mapping.type === 'cc') {
      const data = [
        MIDI_MESSAGE_TYPES.CONTROL_CHANGE,
        mapping.control,
        Math.round(value * 127)
      ];
      this.output.send(data);
    } else {
      const data = [
        value ? MIDI_MESSAGE_TYPES.NOTE_ON : MIDI_MESSAGE_TYPES.NOTE_OFF,
        mapping.note,
        value ? 127 : 0
      ];
      this.output.send(data);
    }
  }
}