// Default patterns that users can start with
export const defaultPatterns = {
  basic: `// Basic drum pattern
stack(
  s("bd").struct("<[x ~ ~ ~] [x ~ ~ ~]>"),
  s("hh*8"),
  s("~ sd").room(0.3)
).slow(2)`,

  melody: `// Simple melody with effects
note("<c3 e3 g3 a3>")
  .s('sawtooth')
  .decay(0.3)
  .sustain(0.2)
  .room(0.6)`,

  groove: `// Funky groove pattern
stack(
  s("bd*2 [~ bd] bd*2").gain(1.2),
  s("[~ hh]*4").gain(0.8),
  s("~ sd:2").room(0.4),
  n("c3*2 [eb3 g3]").s('square').lpf(1000)
).slow(2)`
};

// Sample banks configuration
export const sampleBanks = {
  drums: {
    bd: ['bd/1', 'bd/2', 'bd/3'],
    sd: ['sd/1', 'sd/2', 'sd/3'],
    hh: ['hh/1', 'hh/2', 'hh/3'],
    perc: ['perc/1', 'perc/2', 'perc/3']
  },
  synths: {
    bass: ['bass/1', 'bass/2', 'bass/3'],
    lead: ['lead/1', 'lead/2', 'lead/3'],
    pad: ['pad/1', 'pad/2', 'pad/3']
  }
};