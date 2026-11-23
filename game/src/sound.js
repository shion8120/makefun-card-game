// Small WebAudio bleeps generated in code (no audio files): a card snap, a hit, a clank when a
// guard blocks, a chime for healing, a tick per drawn card, and a fanfare or a fall for the end.
// The audio context starts on the first click or key, as browsers require.

let context = null;
let master = null;
let muted = false;

/** Create (or resume) the audio context; call from a user gesture. */
export function unlockAudio() {
  if (muted) return;
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.32;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') context.resume();
}

/** Silence every sound (screenshot scenes use this). */
export function muteAudio() {
  muted = true;
}

function tone(frequency, start, duration, { type = 'square', volume = 0.5, slideTo = null } = {}) {
  if (!context || muted) return;
  const time = context.currentTime + start;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain).connect(master);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
}

function noise(start, duration, volume = 0.4, lowpass = 1800) {
  if (!context || muted) return;
  const time = context.currentTime + start;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = context.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(master);
  source.start(time);
}

/** A card snapping onto the table. */
export function playCardSound() {
  noise(0, 0.08, 0.35, 4000);
  tone(520, 0, 0.09, { type: 'triangle', volume: 0.35, slideTo: 760 });
}

/** Damage landing; heavier for bigger hits. */
export function hitSound(amount) {
  const weight = Math.min(1, amount / 8);
  tone(180 - weight * 70, 0, 0.25 + weight * 0.15, { type: 'sawtooth', volume: 0.3 + weight * 0.25, slideTo: 50 });
  noise(0, 0.18 + weight * 0.12, 0.35 + weight * 0.3, 900);
}

/** A guard soaking up an attack. */
export function blockSound() {
  tone(880, 0, 0.12, { type: 'square', volume: 0.18 });
  tone(1320, 0.02, 0.16, { type: 'triangle', volume: 0.16 });
}

/** Life restored. */
export function healSound() {
  [523, 659, 784].forEach((frequency, index) => tone(frequency, index * 0.07, 0.22, { type: 'sine', volume: 0.3 }));
}

/** One card drawn. */
export function drawSound(index = 0) {
  tone(660 + index * 90, index * 0.06, 0.06, { type: 'triangle', volume: 0.2 });
}

/** Victory fanfare. */
export function winSound() {
  [392, 523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.11, 0.3, { type: 'square', volume: 0.22 }));
  tone(1047, 0.6, 0.8, { type: 'triangle', volume: 0.3 });
}

/** Defeat: a slow fall. */
export function loseSound() {
  [392, 330, 262, 196].forEach((frequency, index) => tone(frequency, index * 0.18, 0.35, { type: 'triangle', volume: 0.28 }));
}
