// Seeded randomness for EMBER DUEL: one small generator so a seed always deals the same duel
// (screenshot scenes and replays depend on it), plus a Fisher-Yates shuffle that uses it.

/** A deterministic generator returning floats in [0, 1) from a 32-bit seed (mulberry32). */
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle `items` in place with `random` and return it. */
export function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = items[index];
    items[index] = items[swap];
    items[swap] = held;
  }
  return items;
}

/** A fresh seed from the clock, for a normal (non-screenshot) game. */
export function seedFromClock() {
  return (Date.now() ^ (performance.now() * 1000)) >>> 0;
}
