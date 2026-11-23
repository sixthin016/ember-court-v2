// Ember Court — the Ash Regent's play.
//
// A readable opponent, not a random one: it spends its ember on the
// biggest creature it can afford, answers a dangerous board with
// burn, heals when its flame is low, grows its board before buffing
// it, and attacks with everything ready — killing Guards first,
// taking lethal when it sees it, trading up when the trade is good,
// and going for the face otherwise. The same policy drives the
// screenshot scenes, so the frames show a real game, not a pose.

import { CARD_BY_ID } from './config.js';
import { attack, endTurn, playCard } from './state.js';

function biggestAffordableCreature(game, side) {
  let best = null;
  for (const card of side.hand) {
    const def = CARD_BY_ID[card.id];
    if (def.kind !== 'creature' || def.cost > side.ember) continue;
    if (side.board.length >= 5) continue;
    if (!best || def.cost > CARD_BY_ID[best.id].cost) best = card;
  }
  return best;
}

function findSpell(game, side, effect) {
  return side.hand.find((card) => {
    const def = CARD_BY_ID[card.id];
    return def.kind === 'spell' && def.effect === effect && def.cost <= side.ember;
  });
}

function readyAttack(side) {
  return side.board.reduce((sum, minion) => sum + (minion.ready ? minion.attack : 0), 0);
}

function lethalNow(game, side) {
  const foe = side === game.player ? game.enemy : game.player;
  return readyAttack(side) >= foe.flame;
}

function biggestThreat(foe) {
  return foe.board.slice().sort((a, b) => b.attack - a.attack)[0] ?? null;
}

// One full turn for `side`: play cards, then attack with everything.
export function takeTurn(game, side) {
  const foe = side === game.player ? game.enemy : game.player;

  // Heal when hurt and the spell is in hand.
  const rain = findSpell(game, side, 'heal');
  if (rain && side.flame <= 10) playCard(game, side, rain.uid, null);

  // Burn the face when it ends the game, else burn the biggest threat.
  const fireball = findSpell(game, side, 'damage');
  if (fireball) {
    const faceTarget = side === game.player ? 'enemy-face' : 'player-face';
    if (CARD_BY_ID[fireball.id].amount >= foe.flame) {
      playCard(game, side, fireball.uid, faceTarget);
    } else {
      const threat = biggestThreat(foe);
      if (threat && threat.attack >= 4) playCard(game, side, fireball.uid, threat);
    }
  }

  // Zap the strongest enemy minion when lightning is in hand.
  const bolt = findSpell(game, side, 'damage_minion');
  if (bolt) {
    const threat = biggestThreat(foe);
    if (threat && threat.attack >= 3) playCard(game, side, bolt.uid, threat);
  }

  // Grow the board before buffing it.
  let creature = biggestAffordableCreature(game, side);
  while (creature) {
    if (!playCard(game, side, creature.uid, null)) break;
    creature = biggestAffordableCreature(game, side);
  }

  const growth = findSpell(game, side, 'buff');
  if (growth && side.board.length >= 2) playCard(game, side, growth.uid, null);

  const surge = findSpell(game, side, 'ember');
  if (surge) {
    playCard(game, side, surge.uid, null);
    let more = biggestAffordableCreature(game, side);
    while (more) {
      if (!playCard(game, side, more.uid, null)) break;
      more = biggestAffordableCreature(game, side);
    }
  }

  // Attack with every ready minion.
  const faceTarget = side === game.player ? 'enemy-face' : 'player-face';
  for (const minion of side.board.slice()) {
    if (game.phase !== 'play' || !minion.ready) continue;
    const guards = foe.board.filter((held) => held.guard);
    if (guards.length > 0) {
      attack(game, side, minion, guards[0]);
      continue;
    }
    if (lethalNow(game, side)) {
      attack(game, side, minion, faceTarget);
      continue;
    }
    // Trade up: kill a minion worth more than this one, if it survives.
    const prey = foe.board
      .filter((held) => held.health <= minion.attack && held.attack < minion.health)
      .sort((a, b) => b.attack - a.attack)[0];
    if (prey) {
      attack(game, side, minion, prey);
    } else {
      attack(game, side, minion, faceTarget);
    }
  }

  if (game.phase === 'play') endTurn(game);
}
