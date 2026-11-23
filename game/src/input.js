// Ember Court — mouse (and keyboard) input for the human player.
//
// Click a hand card to select it; click again to cancel. A creature
// plays straight onto your board. A spell asks for a target: an enemy
// minion, the Regent's flame (click their flame panel), or your own
// flame for Healing Rain. Click one of your ready minions, then an
// enemy minion or the Regent's flame, to attack. End Turn hands the
// table to the Ash Regent, whose turn runs on a short delay so the
// player can watch it happen. Escape clears a selection; the mute
// button in the top bar toggles the WebAudio sounds.

import { CARD_BY_ID } from './config.js';
import { attack, endTurn, playCard } from './state.js';
import { takeTurn } from './ai.js';
import { playClick, playDraw, playHit, playSpell } from './sound.js';

export function makeInput(game, rerender) {
  const sel = { cardUid: null, attackerUid: null };

  function clearSelection() {
    sel.cardUid = null;
    sel.attackerUid = null;
  }

  function canAct() {
    return game.phase === 'play' && game.active === 'player';
  }

  function afterAction() {
    rerender();
    if (game.phase !== 'play') return;
    if (game.active === 'enemy') {
      // Let the player see the board settle, then the Regent plays.
      window.setTimeout(() => {
        if (game.phase === 'play' && game.active === 'enemy') {
          takeTurn(game, game.enemy);
          playDraw();
          rerender();
        }
      }, 900);
    }
  }

  function onTableClick(event) {
    const muteButton = event.target.closest('#mute-button');
    if (muteButton) return; // main.js owns the mute toggle.
    if (!canAct()) return;
    const cardNode = event.target.closest('.card');
    const flameNode = event.target.closest('.flame-wrap');
    const endButton = event.target.closest('#end-turn');

    if (endButton) {
      clearSelection();
      endTurn(game);
      playDraw();
      afterAction();
      return;
    }

    // Clicking the Regent's flame targets their face; your own flame
    // targets your face (for Healing Rain).
    if (flameNode && !cardNode) {
      const face = flameNode.closest('.foe-zone') ? 'enemy-face' : 'player-face';
      if (sel.cardUid) {
        const def = CARD_BY_ID[game.player.hand.find((c) => c.uid === sel.cardUid)?.id ?? ''];
        if (playCard(game, game.player, sel.cardUid, face)) {
          if (def?.kind === 'spell') playSpell();
          else playClick();
          clearSelection();
          afterAction();
        }
        return;
      }
      if (sel.attackerUid) {
        const minion = game.player.board.find((held) => held.uid === sel.attackerUid);
        if (minion && face === 'enemy-face' && attack(game, game.player, minion, face)) {
          playHit();
          clearSelection();
          afterAction();
        }
        return;
      }
      return;
    }

    if (!cardNode) {
      clearSelection();
      rerender();
      return;
    }

    const uid = cardNode.dataset.uid;
    if (cardNode.classList.contains('on-board')) {
      const minion = game.player.board.find((held) => held.uid === uid);
      if (minion && minion.ready) {
        sel.cardUid = null;
        sel.attackerUid = sel.attackerUid === uid ? null : uid;
        playClick();
        rerender();
      }
      return;
    }

    if (cardNode.closest('.foe-zone')) {
      // An enemy minion: a spell target, or an attack target.
      const minion = game.enemy.board.find((held) => held.uid === uid);
      if (!minion) return;
      if (sel.cardUid) {
        if (playCard(game, game.player, sel.cardUid, minion)) {
          playSpell();
          clearSelection();
          afterAction();
        }
        return;
      }
      if (sel.attackerUid) {
        const attacker = game.player.board.find((held) => held.uid === sel.attackerUid);
        if (attacker && attack(game, game.player, attacker, minion)) {
          playHit();
          clearSelection();
          afterAction();
        }
      }
      return;
    }

    // A card in hand.
    const def = CARD_BY_ID[cardNode.dataset.id];
    if (!def) return;
    if (sel.cardUid === uid) {
      clearSelection();
      rerender();
      return;
    }
    sel.attackerUid = null;
    if (def.kind === 'creature') {
      if (playCard(game, game.player, uid, null)) {
        playClick();
        clearSelection();
        afterAction();
      }
      return;
    }
    // Spells that need no target resolve at once.
    if (def.effect === 'heal' || def.effect === 'buff' || def.effect === 'ember') {
      if (playCard(game, game.player, uid, null)) {
        playSpell();
        clearSelection();
        afterAction();
      }
      return;
    }
    sel.cardUid = uid;
    playClick();
    rerender();
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      clearSelection();
      rerender();
    }
    if ((event.key === 'Enter' || event.key === ' ') && canAct()) {
      const button = document.getElementById('end-turn');
      if (button && document.activeElement === button) {
        clearSelection();
        endTurn(game);
        playDraw();
        afterAction();
      }
    }
  }

  return {
    sel,
    attach() {
      document.getElementById('table').addEventListener('click', onTableClick);
      document.addEventListener('keydown', onKey);
    },
  };
}
