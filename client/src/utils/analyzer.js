// Track analysis tools
export class TrackAnalyzer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  // Analyze BPM using peak detection
  async analyzeBPM(audioBuffer) {
    const peaks = [];
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    
    // Process audio in chunks
    const chunkSize = 2048;
    const chunks = Math.floor(audioBuffer.length / chunkSize);
    let lastPeak = 0;
    let intervals = [];
    
    for (let i = 0; i < chunks; i++) {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Focus on bass frequencies (20-200Hz)
      const bassRange = this.dataArray.slice(0, 20);
      const average = bassRange.reduce((a, b) => a + b, 0) / bassRange.length;
      
      if (average > 200 && (i - lastPeak) > 10) {
        peaks.push(i);
        if (lastPeak > 0) {
          intervals.push(i - lastPeak);
        }
        lastPeak = i;
      }
    }
    
    // Calculate BPM from intervals
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round((this.audioContext.sampleRate * 60) / (averageInterval * chunkSize));
    
    return {
      bpm,
      confidence: this.calculateConfidence(intervals)
    };
  }

  // Analyze musical key using frequency analysis
  async analyzeKey(audioBuffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    
    // Process multiple chunks for better accuracy
    const samples = 100;
    const noteStrengths = new Array(12).fill(0);
    
    for (let i = 0; i < samples; i++) {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Map frequencies to notes
      this.dataArray.forEach((value, index) => {
        const frequency = index * this.audioContext.sampleRate / this.analyser.fftSize;
        const note = Math.round(12 * Math.log2(frequency / 440) + 69) % 12;
        noteStrengths[note] += value;
      });
    }
    
    // Find strongest notes
    const strongestNotes = noteStrengths
      .map((strength, note) => ({ note, strength }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    
    return {
      key: this.noteToKey(strongestNotes[0].note),
      scale: this.determineScale(strongestNotes),
      confidence: this.calculateConfidence(noteStrengths)
    };
  }

  // Analyze energy distribution
  async analyzeEnergy(audioBuffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    
    const bands = {
      sub: { range: [20, 60], energy: 0 },
      bass: { range: [60, 250], energy: 0 },
      lowMid: { range: [250, 500], energy: 0 },
      mid: { range: [500, 2000], energy: 0 },
      highMid: { range: [2000, 4000], energy: 0 },
      high: { range: [4000, 20000], energy: 0 }
    };
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    Object.values(bands).forEach(band => {
      const lowBin = Math.floor(band.range[0] * this.analyser.fftSize / this.audioContext.sampleRate);
      const highBin = Math.ceil(band.range[1] * this.analyser.fftSize / this.audioContext.sampleRate);
      const bandData = this.dataArray.slice(lowBin, highBin);
      band.energy = bandData.reduce((a, b) => a + b, 0) / bandData.length / 255;
    });
    
    return bands;
  }

  // Generate detailed waveform data
  async generateWaveform(audioBuffer, width) {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / width);
    const waveform = new Float32Array(width);
    
    for (let i = 0; i < width; i++) {
      const start = blockSize * i;
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < blockSize && (start + j) < channelData.length; j++) {
        const value = channelData[start + j];
        if (value < min) min = value;
        if (value > max) max = value;
      }
      
      waveform[i] = {
        min: min,
        max: max,
        avg: (min + max) / 2
      };
    }
    
    return waveform;
  }

  // Helper functions
  noteToKey(note) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[note];
  }

  determineScale(strongestNotes) {
    const majorPattern = [0, 4, 7]; // Root, Major Third, Perfect Fifth
    const minorPattern = [0, 3, 7]; // Root, Minor Third, Perfect Fifth
    
    const intervals = strongestNotes
      .map(n => (n.note - strongestNotes[0].note + 12) % 12);
    
    const majorMatch = this.patternMatch(intervals, majorPattern);
    const minorMatch = this.patternMatch(intervals, minorPattern);
    
    return majorMatch > minorMatch ? 'major' : 'minor';
  }

  patternMatch(intervals, pattern) {
    return intervals.reduce((match, interval) => 
      match + (pattern.includes(interval) ? 1 : 0), 0);
  }

  calculateConfidence(values) {
    const max = Math.max(...values);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    return (max - average) / max; // 0 to 1
  }
}

// Analysis visualization
export class AnalysisVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // Draw waveform
  drawWaveform(waveform, color = '#646cff') {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    const middle = height / 2;
    const scale = height / 2;
    
    waveform.forEach((point, i) => {
      const x = (i / waveform.length) * width;
      this.ctx.moveTo(x, middle + point.min * scale);
      this.ctx.lineTo(x, middle + point.max * scale);
    });
    
    this.ctx.stroke();
  }

  // Draw frequency spectrum
  drawSpectrum(dataArray, color = '#646cff') {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / dataArray.length;
    
    this.ctx.fillStyle = color;
    dataArray.forEach((value, i) => {
      const percent = value / 255;
      const barHeight = height * percent;
      const x = i * barWidth;
      const y = height - barHeight;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  // Draw energy distribution
  drawEnergyBands(bands, color = '#646cff') {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    const bandCount = Object.keys(bands).length;
    const barWidth = width / bandCount;
    
    this.ctx.fillStyle = color;
    Object.values(bands).forEach((band, i) => {
      const barHeight = height * band.energy;
      const x = i * barWidth;
      const y = height - barHeight;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  // Draw beat grid
  drawBeatGrid(bpm, duration, color = '#646cff') {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    const beatLength = 60 / bpm; // seconds
    const totalBeats = Math.floor(duration / beatLength);
    const beatWidth = width / totalBeats;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < totalBeats; i++) {
      const x = i * beatWidth;
      const isMeasure = i % 4 === 0;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, isMeasure ? height : height / 2);
      this.ctx.stroke();
    }
  }
}