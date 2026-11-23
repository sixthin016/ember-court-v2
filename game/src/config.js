// Ember Court — the courts, the cards, the table constants.
//
// A duel of flame. Two courtiers sit across a felt table: you, the
// Keeper, and the Ash Regent. Each guards 20 flame. Every turn the
// ember ramp grows — 1 on turn one, up to 8 — and each side draws a
// card. Spend ember to play creatures and spells, break through the
// Guards, and burn the other side's flame to zero.
//
// The 24 cards belong to four courts. A court is told by colour AND
// by shape, never by text alone, so it reads at thumbnail size:
//   Ember  ▲  red    — blunt, aggressive creatures and burn spells
//   Tide   ●  blue   — guards that stand in the way, and healing
//   Thorn  ◆  green  — sturdy bodies that grow together
//   Gale   ✦  amber  — quick tricks that replace themselves
//
// Keywords: Guard (an attacker must strike a Guard first) and Swift
// (draw a card the moment the card is played). A creature played this
// turn is drowsy and cannot attack until the next turn.

export const START_FLAME = 20;
export const MAX_FLAME = 20;
export const MAX_EMBER = 8;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const HAND_SIZE = 5;

export const COURTS = {
  ember: { name: 'Ember', glyph: '▲', color: '#e5484d', glow: '#ff7a3c', dark: '#7a1f22', motif: 'flame' },
  tide: { name: 'Tide', glyph: '●', color: '#3e9bff', glow: '#7cc4ff', dark: '#173f6e', motif: 'wave' },
  thorn: { name: 'Thorn', glyph: '◆', color: '#4caf6d', glow: '#8fe0a8', dark: '#1d4d2e', motif: 'thorn' },
  gale: { name: 'Gale', glyph: '✦', color: '#f5b942', glow: '#ffe08a', dark: '#6e5212', motif: 'wind' },
};

// Every card in the game. `kind` is creature or spell; `text` is the
// plain-language rule printed on the card face; `effect` is the tag
// the rules engine switches on.
export const CARDS = [
  { id: 'imp', name: 'Cinder Imp', court: 'ember', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'hound', name: 'Spark Hound', court: 'ember', kind: 'creature', cost: 2, attack: 3, health: 2, text: 'It hunts the warmest flame.' },
  { id: 'knight', name: 'Flame Knight', court: 'ember', kind: 'creature', cost: 3, attack: 3, health: 4, text: 'Oathbound to the last ember.' },
  { id: 'drake', name: 'Pyre Drake', court: 'ember', kind: 'creature', cost: 5, attack: 5, health: 5, text: 'Its shadow is a wildfire.' },
  { id: 'phoenix', name: 'Ember Phoenix', court: 'ember', kind: 'creature', cost: 6, attack: 6, health: 5, text: 'It burns so the court may rise.' },
  { id: 'warden', name: 'Tide Warden', court: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, guard: true, text: 'Guard. The tide stands in the way.' },
  { id: 'serpent', name: 'Mist Serpent', court: 'tide', kind: 'creature', cost: 3, attack: 4, health: 3, text: 'It strikes from the fog.' },
  { id: 'leviathan', name: 'Leviathan', court: 'tide', kind: 'creature', cost: 6, attack: 7, health: 7, text: 'The whole sea, wearing scales.' },
  { id: 'sprout', name: 'Thorn Sprout', court: 'thorn', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'Small roots, deep patience.' },
  { id: 'wolf', name: 'Briar Wolf', court: 'thorn', kind: 'creature', cost: 2, attack: 2, health: 2, text: 'It runs where the hedge grows.' },
  { id: 'guardian', name: 'Grove Guard', court: 'thorn', kind: 'creature', cost: 4, attack: 4, health: 6, guard: true, text: 'Guard. The grove does not yield.' },
  { id: 'colossus', name: 'Thorn Titan', court: 'thorn', kind: 'creature', cost: 5, attack: 6, health: 6, text: 'A walking hill of brambles.' },
  { id: 'scout', name: 'Gale Scout', court: 'gale', kind: 'creature', cost: 1, attack: 2, health: 1, swift: true, text: 'Swift. Draw a card.' },
  { id: 'crow', name: 'Storm Crow', court: 'gale', kind: 'creature', cost: 3, attack: 3, health: 2, swift: true, text: 'Swift. Draw a card.' },
  { id: 'tempest', name: 'Sky Tempest', court: 'gale', kind: 'creature', cost: 4, attack: 5, health: 4, text: 'The storm answers no master.' },
  { id: 'fireball', name: 'Fireball', court: 'ember', kind: 'spell', cost: 3, text: 'Deal 4 damage to any target.', effect: 'damage', amount: 4 },
  { id: 'rain', name: 'Healing Rain', court: 'tide', kind: 'spell', cost: 2, text: 'Restore 5 flame to yourself.', effect: 'heal', amount: 5 },
  { id: 'lightning', name: 'Storm Bolt', court: 'gale', kind: 'spell', cost: 2, text: 'Deal 3 damage to a minion.', effect: 'damage_minion', amount: 3 },
  { id: 'overgrowth', name: 'Overgrowth', court: 'thorn', kind: 'spell', cost: 3, text: 'Give your minions +1 attack and +1 health.', effect: 'buff', amount: 1 },
  { id: 'surge', name: 'Ember Surge', court: 'ember', kind: 'spell', cost: 2, text: 'Gain 2 ember this turn.', effect: 'ember', amount: 2 },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card]));

// The deck: one of every card, plus a second copy of the four cheapest
// creatures, so the opening turns always have something to play.
export function buildDeck() {
  const deck = CARDS.map((card) => card.id);
  deck.push('imp', 'hound', 'sprout', 'scout');
  return deck;
}
