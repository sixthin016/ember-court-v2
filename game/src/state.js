// Ember Court — the rules. Pure state, no DOM: a game is a plain
// object that state functions move forward, so the human game, the
// AI game and the screenshot scenes all play by exactly the same
// rules, and a scene can be replayed from its seed alone.
//
// A turn: gain ember (turn number, capped at 8), draw a card, play
// cards and attack with ready minions, then end the turn. A minion
// played this turn is drowsy and cannot attack until next turn.
// Combat is a trade: the attacker deals its attack, and a minion
// target deals its attack back. Guards must be attacked before
// anything behind them. Flame reaching 0 ends the game at once.

import { CARD_BY_ID, HAND_SIZE, MAX_BOARD, MAX_EMBER, MAX_FLAME, MAX_HAND, START_FLAME, buildDeck } from './config.js';
import { makeRng, shuffle } from './random.js';

let nextMinionId = 1;

export function newGame(seed) {
  nextMinionId = 1;
  const rng = makeRng(seed);
  const game = {
    seed,
    turn: 1,
    phase: 'play', // play | won | lost
    active: 'player', // whose turn it is
    log: [],
    player: newSide('player', shuffle(buildDeck(), rng), rng),
    enemy: newSide('enemy', shuffle(buildDeck(), rng), rng),
  };
  drawCards(game.player, HAND_SIZE);
  drawCards(game.enemy, HAND_SIZE);
  startTurn(game, game.player);
  return game;
}

function newSide(owner, deck, rng) {
  return {
    owner,
    deck,
    hand: [],
    board: [],
    flame: START_FLAME,
    ember: 0,
    emberMax: 0,
    rng,
  };
}

export function drawCards(side, count) {
  for (let index = 0; index < count; index += 1) {
    if (side.hand.length >= MAX_HAND) return;
    const id = side.deck.pop();
    if (id === undefined) return;
    side.hand.push({ uid: `c${side.owner}-${side.deck.length}-${id}-${side.hand.length}`, id });
  }
}

export function startTurn(game, side) {
  side.emberMax = Math.min(game.turn, MAX_EMBER);
  side.ember = side.emberMax;
  for (const minion of side.board) minion.ready = true;
}

export function endTurn(game) {
  const outgoing = game.active === 'player' ? game.player : game.enemy;
  const incoming = game.active === 'player' ? game.enemy : game.player;
  game.active = incoming.owner;
  if (incoming.owner === 'player') game.turn += 1;
  drawCards(incoming, 1);
  startTurn(game, incoming);
  game.log.push(`${nameOf(outgoing)} ends the turn.`);
}

export function nameOf(side) {
  return side.owner === 'player' ? 'You' : 'Ash Regent';
}

function findCard(side, uid) {
  return side.hand.find((card) => card.uid === uid);
}

// Play a card from hand. `target` is a minion object, a face string
// ('player-face' / 'enemy-face'), or null for self-only spells.
// Returns true when the card was played.
export function playCard(game, side, uid, target) {
  const card = findCard(side, uid);
  if (!card || game.phase !== 'play') return false;
  const def = CARD_BY_ID[card.id];
  if (side.ember < def.cost) return false;
  const foe = side === game.player ? game.enemy : game.player;

  if (def.kind === 'creature') {
    if (side.board.length >= MAX_BOARD) return false;
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    side.board.push({
      uid: `m${nextMinionId++}`,
      id: def.id,
      attack: def.attack,
      health: def.health,
      maxHealth: def.health,
      guard: Boolean(def.guard),
      ready: false,
    });
    game.log.push(`${nameOf(side)} plays ${def.name}.`);
    if (def.swift) {
      drawCards(side, 1);
      game.log.push(`${def.name} draws a card.`);
    }
    return true;
  }

  // Spells.
  if (def.effect === 'damage') {
    if (!target) return false;
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    dealDamage(game, target, def.amount);
    game.log.push(`${nameOf(side)} casts ${def.name} for ${def.amount}.`);
    return true;
  }
  if (def.effect === 'damage_minion') {
    if (!target || typeof target !== 'object') return false;
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    dealDamage(game, target, def.amount);
    game.log.push(`${nameOf(side)} casts ${def.name} for ${def.amount}.`);
    return true;
  }
  if (def.effect === 'heal') {
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    side.flame = Math.min(MAX_FLAME, side.flame + def.amount);
    game.log.push(`${nameOf(side)} restores ${def.amount} flame.`);
    return true;
  }
  if (def.effect === 'buff') {
    if (side.board.length === 0) return false;
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    for (const minion of side.board) {
      minion.attack += def.amount;
      minion.health += def.amount;
      minion.maxHealth += def.amount;
    }
    game.log.push(`${nameOf(side)} casts ${def.name}: the board grows.`);
    return true;
  }
  if (def.effect === 'ember') {
    side.ember -= def.cost;
    side.hand = side.hand.filter((held) => held.uid !== uid);
    side.ember += def.amount;
    game.log.push(`${nameOf(side)} surges with ember.`);
    return true;
  }
  return false;
}

// Deal damage to a minion or to a side's flame ('player-face' /
// 'enemy-face'). Minions at 0 health leave the board; flame at 0
// ends the game.
export function dealDamage(game, target, amount) {
  if (typeof target === 'string') {
    const side = target === 'player-face' ? game.player : game.enemy;
    side.flame = Math.max(0, side.flame - amount);
    game.log.push(`${nameOf(side)} takes ${amount} damage.`);
    checkEnd(game);
    return;
  }
  target.health -= amount;
  game.log.push(`${CARD_BY_ID[target.id].name} takes ${amount} damage.`);
  if (target.health <= 0) {
    const side = game.player.board.includes(target) ? game.player : game.enemy;
    side.board = side.board.filter((minion) => minion !== target);
    game.log.push(`${CARD_BY_ID[target.id].name} falls.`);
  }
}

// A minion attacks a target: it deals its attack, and a minion
// target strikes back. Guards block the way: while the foe has a
// Guard, only Guards may be attacked, and the face is safe behind
// them.
export function attack(game, side, minion, target) {
  if (game.phase !== 'play' || !minion.ready) return false;
  const foe = side === game.player ? game.enemy : game.player;
  const guards = foe.board.filter((held) => held.guard);
  if (typeof target === 'string') {
    if (guards.length > 0) return false;
  } else if (!guards.includes(target) && guards.length > 0) {
    return false;
  }
  minion.ready = false;
  if (typeof target === 'string') {
    dealDamage(game, target, minion.attack);
    game.log.push(`${CARD_BY_ID[minion.id].name} strikes the flame for ${minion.attack}.`);
    return true;
  }
  const back = target.attack;
  target.health -= minion.attack;
  game.log.push(`${CARD_BY_ID[minion.id].name} hits ${CARD_BY_ID[target.id].name} for ${minion.attack}.`);
  if (target.health <= 0) {
    foe.board = foe.board.filter((held) => held !== target);
    game.log.push(`${CARD_BY_ID[target.id].name} falls.`);
  } else {
    minion.health -= back;
    game.log.push(`${CARD_BY_ID[target.id].name} strikes back for ${back}.`);
    if (minion.health <= 0) {
      side.board = side.board.filter((held) => held !== minion);
      game.log.push(`${CARD_BY_ID[minion.id].name} falls.`);
    }
  }
  checkEnd(game);
  return true;
}

function checkEnd(game) {
  if (game.enemy.flame <= 0) {
    game.phase = 'won';
    game.log.push('The Ash Regent falls. The court is yours.');
  } else if (game.player.flame <= 0) {
    game.phase = 'lost';
    game.log.push('Your flame gutters out.');
  }
}

// Hand summary for the AI and for the scenes: cards affordable now.
export function playableCards(game, side) {
  return side.hand.filter((card) => CARD_BY_ID[card.id].cost <= side.ember);
}

// A quick read of the table, for the AI and for the log line.
export function boardStrength(side) {
  return side.board.reduce((sum, minion) => sum + minion.attack + minion.health, 0);
}
