// Audio context and nodes
let audioContext;

// Initialize Web Audio API
export function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return {
    context: audioContext
  };
}

// Load audio file
export async function loadAudio(file) {
  try {
    const buffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    return source;
  } catch (error) {
    console.error('Error loading audio:', error);
    throw error;
  }
}

// Create gain node
export function createGain() {
  return audioContext.createGain();
}

// Create 3-band EQ
export function createEQ() {
  const low = audioContext.createBiquadFilter();
  const mid = audioContext.createBiquadFilter();
  const high = audioContext.createBiquadFilter();

  low.type = 'lowshelf';
  low.frequency.value = 320;
  
  mid.type = 'peaking';
  mid.frequency.value = 1000;
  mid.Q.value = 0.5;
  
  high.type = 'highshelf';
  high.frequency.value = 3200;

  return { low, mid, high };
}

// Create filter
export function createFilter() {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 20000;
  filter.Q.value = 1;
  return filter;
}

// Create effects (delay, reverb)
export function createEffects() {
  const delay = audioContext.createDelay();
  delay.delayTime.value = 0.3;
  
  const delayGain = audioContext.createGain();
  delayGain.gain.value = 0;
  
  const reverbGain = audioContext.createGain();
  reverbGain.gain.value = 0;

  return { delay, delayGain, reverbGain };
}

// Create beat effects (flanger, phaser)
export function createBeatEffects() {
  const flangerGain = audioContext.createGain();
  flangerGain.gain.value = 0;
  
  const phaserGain = audioContext.createGain();
  phaserGain.gain.value = 0;

  return { flangerGain, phaserGain };
}

// Generate waveform data
export function generateWaveformData(audioBuffer, width) {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / width);
  const waveformData = [];

  for (let i = 0; i < width; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[blockStart + j]);
    }
    
    waveformData.push(sum / blockSize);
  }

  // Normalize
  const maxValue = Math.max(...waveformData);
  return waveformData.map(value => value / maxValue);
}

// Calculate beat grid
export function calculateBeatGrid(bpm, duration) {
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);
  const grid = [];

  for (let i = 0; i < totalBeats; i++) {
    grid.push({
      time: i * beatInterval,
      isMeasureStart: i % 4 === 0
    });
  }

  return grid;
}

// Sample bank management
export const SAMPLE_BANKS = {
  DRUMS: {
    id: 'DRUMS',
    name: 'Drum Kit',
    samples: {
      'Kick': '/samples/kick.wav',
      'Snare': '/samples/snare.wav',
      'HiHat': '/samples/hihat.wav',
      'Clap': '/samples/clap.wav'
    }
  },
  FX: {
    id: 'FX',
    name: 'Effects',
    samples: {
      'Rise': '/samples/kick.wav', // Temporarily reuse kick sample
      'Drop': '/samples/snare.wav', // Temporarily reuse snare sample
      'Impact': '/samples/hihat.wav', // Temporarily reuse hihat sample
      'Sweep': '/samples/clap.wav' // Temporarily reuse clap sample
    }
  }
};

export class SampleBankManager {
  constructor() {
    this.currentBank = SAMPLE_BANKS.DRUMS;
    this.loadedSamples = {};
  }

  getCurrentBank() {
    return this.currentBank;
  }

  setCurrentBank(bankId) {
    if (SAMPLE_BANKS[bankId]) {
      this.currentBank = SAMPLE_BANKS[bankId];
    }
  }

  async loadSample(name) {
    try {
      if (this.loadedSamples[name]) {
        return this.loadedSamples[name];
      }

      const path = this.currentBank.samples[name];
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load sample: ${name}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      this.loadedSamples[name] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error('Error loading sample:', error);
      return null;
    }
  }
}

export function playSample(buffer) {
  if (!buffer) return;
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  const gain = audioContext.createGain();
  gain.gain.value = 0.5; // Reduce volume to prevent clipping
  
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

// Effect chain presets
export const EFFECT_PRESETS = {
  CLEAN: {
    name: 'Clean',
    nodes: []
  },
  ECHO: {
    name: 'Echo',
    nodes: [
      { name: 'Delay', type: 'effect' }
    ]
  },
  SPACE: {
    name: 'Space',
    nodes: [
      { name: 'Reverb', type: 'effect' }
    ]
  },
  DUBSTEP: {
    name: 'Dubstep',
    nodes: [
      { name: 'Filter', type: 'filter' },
      { name: 'Phaser', type: 'beat' }
    ]
  }
};