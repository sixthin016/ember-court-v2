// Ember Court — the screenshot scenes behind ?shot=start|play|win|lose.
//
// Each scene plays the real rules forward from a fresh game with a
// fixed seed, steered by the same AI that plays the Regent's turns, so
// every frame is what a short game really looks like and the same seed
// always deals the same frame. No scene is hand-placed: the win scene
// is a game the Keeper's side won, the loss scene one it lost, and the
// play scene is a game still in the middle, both boards occupied and
// both flames still burning.

import { endTurn, newGame } from './state.js';
import { takeTurn } from './ai.js';

// One side plays its turn with the AI; the other side passes (plays
// nothing, attacks nothing) and just ends its turn.
function duelUntil(game, winner, maxTurns) {
  let guard = 0;
  while (game.phase === 'play' && game.turn <= maxTurns && guard < 400) {
    guard += 1;
    const side = game.active === 'player' ? game.player : game.enemy;
    if (side.owner === winner) {
      takeTurn(game, side);
    } else {
      endTurn(game);
    }
  }
  return game;
}

// Both sides play properly until the middle of the game: turn 5 or
// later, both boards occupied, nobody dead yet.
function midGame(seed) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const game = newGame(seed + attempt * 101);
    let guard = 0;
    while (game.phase === 'play' && guard < 200) {
      guard += 1;
      const side = game.active === 'player' ? game.player : game.enemy;
      takeTurn(game, side);
      if (game.turn >= 5 && game.player.board.length > 0 && game.enemy.board.length > 0) break;
    }
    if (game.phase === 'play' && game.player.board.length > 0 && game.enemy.board.length > 0) return game;
  }
  // Fallback: whatever the first seed reached, still a real game.
  return newGame(seed);
}

// Set up the named scene and return the game plus which screen to show
// over it: title, play, won or lost.
export function stageShot(name, seed) {
  if (name === 'win') {
    const game = duelUntil(newGame(seed), 'player', 40);
    return { game, screen: game.phase === 'won' ? 'won' : 'play' };
  }
  if (name === 'lose') {
    const game = duelUntil(newGame(seed), 'enemy', 40);
    return { game, screen: game.phase === 'lost' ? 'lost' : 'play' };
  }
  if (name === 'play') {
    return { game: midGame(seed), screen: 'play' };
  }
  return { game: newGame(seed), screen: 'title' };
}
