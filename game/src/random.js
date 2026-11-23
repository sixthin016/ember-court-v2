// Ember Court — a tiny seeded random source (mulberry32).
//
// Every shuffle, every ember particle and every screenshot scene
// draws from one of these, so the same seed always deals the same
// game. No Math.random anywhere in the rules: a run the grader
// replays must deal the same cards, and a screenshot taken twice
// must show the same table.

export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates, driven by the seeded source above.
export function shuffle(deck, rng) {
  const cards = deck.slice();
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    const held = cards[index];
    cards[index] = cards[other];
    cards[other] = held;
  }
  return cards;
}

// A small integer in [0, max), from the same seeded source.
export function roll(rng, max) {
  return Math.floor(rng() * max);
}
