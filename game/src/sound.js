// Ember Court — sounds, synthesized live with WebAudio.
//
// No audio files, no network: every sound is an oscillator (or a
// short burst of filtered noise) shaped by an envelope. The mixer is
// created lazily on the first user gesture, so browsers that block
// audio before interaction never throw. A mute toggle lives on the
// table; the state is kept in this module only.

let ctx = null;
let muted = false;

function audio() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  return ctx;
}

function tone(freq, dur, type, gainValue, when = 0, slideTo = null) {
  const ac = audio();
  if (!ac || muted) return;
  const start = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noiseBurst(dur, gainValue, cutoff) {
  const ac = audio();
  if (!ac || muted) return;
  const start = ac.currentTime;
  const length = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  source.connect(filter).connect(gain).connect(ac.destination);
  source.start(start);
}

// A soft wooden click when a card is picked up or played.
export function playClick() {
  tone(620, 0.07, 'triangle', 0.16);
  tone(930, 0.05, 'triangle', 0.08, 0.02);
}

// A low thud with a crackle when a minion strikes.
export function playHit() {
  noiseBurst(0.14, 0.28, 900);
  tone(140, 0.16, 'sine', 0.3, 0, 70);
}

// A bright chime when a spell resolves.
export function playSpell() {
  tone(880, 0.12, 'sine', 0.14);
  tone(1318, 0.16, 'sine', 0.12, 0.07);
}

// A rising arpeggio for the victory screen.
export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, index) => tone(freq, 0.35, 'triangle', 0.18, index * 0.11));
  tone(1319, 0.6, 'sine', 0.12, 0.48);
}

// A low descending phrase for the defeat screen.
export function playLose() {
  tone(392, 0.3, 'sine', 0.16, 0, 330);
  tone(311, 0.4, 'sine', 0.16, 0.22, 262);
  tone(233, 0.6, 'sine', 0.14, 0.48, 196);
}

// A short draw whoosh at the start of a turn.
export function playDraw() {
  noiseBurst(0.09, 0.1, 2400);
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// Unlock the audio context from the first pointer or key gesture.
export function unlockAudio() {
  audio();
}
