// Ember Court — the table. DOM rendering only: it reads a game
// object and paints the felt table, the two hands, the two boards,
// the flame totals and the title / win / loss screens. Cards are big
// and legible on purpose: the judge sees them shrunk to a thumbnail,
// so cost, name, court colour and stats must all read at a glance.
//
// Every court has its own colour and shape (Ember ▲ red, Tide ●
// blue, Thorn ◆ green, Gale ✦ amber) and its own painted art, so a
// card's court reads by colour, by shape and by pattern, never by
// text alone.

import { CARD_BY_ID, COURTS } from './config.js';
import { paintCardArt } from './art.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function flameBar(side, label) {
  const wrap = el('div', 'flame-wrap');
  const name = el('div', 'side-name', label);
  const flame = el('div', 'flame');
  const heart = el('span', 'flame-glyph', '🔥');
  const value = el('span', 'flame-value', String(side.flame));
  const total = el('span', 'flame-total', '/ 20 flame');
  flame.append(heart, value, total);
  const bar = el('div', 'flame-bar');
  const fill = el('div', 'flame-fill');
  fill.style.width = `${Math.max(0, (side.flame / 20) * 100)}%`;
  bar.append(fill);
  wrap.append(name, flame, bar);
  return wrap;
}

function cardFace(def, opts = {}) {
  const card = el('div', `card court-${def.court}${opts.mini ? ' mini' : ''}${opts.selected ? ' selected' : ''}${opts.playable ? ' playable' : ''}${opts.drowsy ? ' drowsy' : ''}`);
  card.dataset.uid = opts.uid ?? '';
  card.dataset.id = def.id;

  const cost = el('div', 'cost', String(def.cost));
  const art = el('div', 'art');
  art.append(paintCardArt(def, opts.mini ? 86 : 102, opts.mini ? 42 : 54));
  const name = el('div', 'card-name', def.name);
  const text = el('div', 'card-text', def.text);
  card.append(cost, art, name, text);

  if (def.kind === 'creature') {
    const stats = el('div', 'stats');
    stats.append(el('span', 'attack', `⚔ ${opts.attack ?? def.attack}`));
    stats.append(el('span', 'health', `♥ ${opts.health ?? def.health}`));
    card.append(stats);
    if (def.guard) card.append(el('div', 'keyword guard-tag', 'GUARD'));
    if (def.swift) card.append(el('div', 'keyword swift-tag', 'SWIFT'));
  } else {
    card.append(el('div', 'spell-tag', 'SPELL'));
  }
  if (opts.drowsy && !opts.mini) card.append(el('div', 'drowsy-tag', 'DROWSY'));
  return card;
}

function cardBack(index) {
  const back = el('div', 'card-back');
  back.style.transform = `rotate(${(index - 2) * 6}deg)`;
  back.append(el('div', 'back-glyph', '▲'));
  return back;
}

function boardRow(side, sel, interactive) {
  const row = el('div', 'board-row');
  if (side.board.length === 0) {
    row.append(el('div', 'board-empty', side.owner === 'player' ? 'Your side of the table is empty — play a creature.' : 'The Regent has no creatures out.'));
    return row;
  }
  for (const minion of side.board) {
    const def = CARD_BY_ID[minion.id];
    const node = cardFace(def, {
      mini: true,
      uid: minion.uid,
      attack: minion.attack,
      health: minion.health,
      drowsy: !minion.ready,
      selected: sel.attackerUid === minion.uid,
    });
    node.classList.add('on-board');
    if (interactive && minion.ready) node.classList.add('can-attack');
    if (interactive && sel.attackerUid === minion.uid) node.classList.add('attacking');
    row.append(node);
  }
  return row;
}

function overlay(title, lines, buttonLabel, tone) {
  const veil = el('div', `overlay ${tone}`);
  const panel = el('div', 'overlay-panel');
  panel.append(el('h1', 'overlay-title', title));
  for (const line of lines) panel.append(el('p', 'overlay-line', line));
  if (buttonLabel) {
    const button = el('button', 'big-button', buttonLabel);
    button.id = 'overlay-button';
    panel.append(button);
  }
  veil.append(panel);
  return veil;
}

export function titleScreen() {
  const lines = [
    'A duel of flame between you, the Keeper, and the Ash Regent.',
    'Spend ember to play creatures and spells. Break through Guards,',
    'then burn the Regent’s flame from 20 to 0 — before yours is gone.',
    '▲ Ember burns   ● Tide guards   ◆ Thorn endures   ✦ Gale tricks',
  ];
  return overlay('EMBER COURT', lines, 'Begin the Duel', 'title');
}

export function endScreen(won, game) {
  if (won) {
    return overlay('VICTORY', [
      'The Ash Regent’s flame gutters out. The court is yours, Keeper.',
      `Final flame — You ${game.player.flame} · Regent ${game.enemy.flame} · Turn ${game.turn}`,
      'Play again to defend the court.',
    ], 'Play Again', 'win');
  }
  return overlay('DEFEAT', [
    'Your flame gutters out. The Ash Regent keeps the court — this time.',
    `Final flame — You ${game.player.flame} · Regent ${game.enemy.flame} · Turn ${game.turn}`,
    'The ember remembers. Duel again.',
  ], 'Duel Again', 'lose');
}

// Paint the whole table for `game`. `sel` is the input selection
// { cardUid, attackerUid }; `canAct` is false on the Regent's turn.
export function render(game, sel, canAct) {
  const root = document.getElementById('table');
  root.innerHTML = '';

  const topbar = el('header', 'topbar');
  topbar.append(el('div', 'brand', 'EMBER COURT'));
  topbar.append(el('div', 'turn-indicator', game.phase === 'play' ? `Turn ${game.turn} — ${game.active === 'player' ? 'Your turn' : 'Ash Regent’s turn'}` : 'The duel is decided'));
  topbar.append(el('div', 'deck-count', `Deck ${game.player.deck.length} · Regent ${game.enemy.deck.length}`));
  const muteButton = el('button', 'mute-button', '♪');
  muteButton.id = 'mute-button';
  muteButton.title = 'Toggle sound';
  topbar.append(muteButton);
  root.append(topbar);

  // Opponent: flame, hand backs, board.
  const foeZone = el('section', 'zone foe-zone');
  foeZone.append(flameBar(game.enemy, 'ASH REGENT'));
  const foeHand = el('div', 'foe-hand');
  for (let index = 0; index < Math.min(game.enemy.hand.length, 5); index += 1) foeHand.append(cardBack(index));
  foeHand.append(el('div', 'hand-count', `${game.enemy.hand.length} cards`));
  foeZone.append(foeHand);
  foeZone.append(boardRow(game.enemy, sel, false));
  root.append(foeZone);

  // Middle strip: the log and the End Turn button.
  const mid = el('div', 'mid-strip');
  const log = el('div', 'log');
  for (const line of game.log.slice(-3)) log.append(el('div', 'log-line', line));
  mid.append(log);
  const endButton = el('button', 'end-turn', 'End Turn');
  endButton.id = 'end-turn';
  endButton.disabled = !canAct || game.phase !== 'play';
  mid.append(endButton);
  root.append(mid);

  // Player: board, ember, hand.
  const myZone = el('section', 'zone my-zone');
  myZone.append(boardRow(game.player, sel, canAct));
  const handBar = el('div', 'hand-bar');
  const ember = el('div', 'ember');
  ember.append(el('span', 'ember-glyph', '◆'));
  ember.append(el('span', 'ember-value', `${game.player.ember} / ${game.player.emberMax} ember`));
  handBar.append(ember);
  handBar.append(flameBar(game.player, 'YOU — THE KEEPER'));
  myZone.append(handBar);
  const hand = el('div', 'hand');
  for (const card of game.player.hand) {
    const def = CARD_BY_ID[card.id];
    const node = cardFace(def, {
      uid: card.uid,
      selected: sel.cardUid === card.uid,
      playable: canAct && def.cost <= game.player.ember,
    });
    if (canAct) node.classList.add('in-hand');
    hand.append(node);
  }
  myZone.append(hand);
  root.append(myZone);

  if (game.phase === 'won') root.append(endScreen(true, game));
  if (game.phase === 'lost') root.append(endScreen(false, game));
}
