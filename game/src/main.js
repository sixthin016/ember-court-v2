// Ember Court — bootstrap.
//
// Loads a fresh game, paints the table, and wires up input. With no
// ?shot= parameter it is the human game: the title screen first, then
// the duel. With ?shot=start|play|win|lose it stages that scene from
// the real rules (see shots.js) and sets window.__shotReady once the
// frame is painted, which is what the screenshot driver waits for.
//
// The ember particle layer is started after the first paint and
// re-attached after every repaint, because rendering rebuilds the
// table's DOM. Sounds unlock on the first gesture; the mute button
// in the top bar toggles them.

import { newGame } from './state.js';
import { render, titleScreen } from './render.js';
import { makeInput } from './input.js';
import { stageShot } from './shots.js';
import { startParticles } from './particles.js';
import { isMuted, playLose, playWin, toggleMute, unlockAudio } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

let game;
let screen = 'play';
let input = null;
let endJinglePlayed = false;

function wireMute() {
  const button = document.getElementById('mute-button');
  if (!button) return;
  button.textContent = isMuted() ? '♪̶' : '♪';
  button.classList.toggle('muted', isMuted());
  button.addEventListener('click', () => {
    unlockAudio();
    const nowMuted = toggleMute();
    button.textContent = nowMuted ? '♪̶' : '♪';
    button.classList.toggle('muted', nowMuted);
  });
}

function paint() {
  const sel = input ? input.sel : { cardUid: null, attackerUid: null };
  const canAct = game.phase === 'play' && game.active === 'player' && screen === 'play';
  render(game, sel, canAct);
  startParticles(document.getElementById('table'), seed);
  wireMute();
  if (screen === 'title') {
    document.getElementById('table').append(titleScreen());
    const button = document.getElementById('overlay-button');
    if (button) button.addEventListener('click', startDuel);
  }
  if (screen === 'won' || screen === 'lost') {
    const button = document.getElementById('overlay-button');
    if (button) button.addEventListener('click', () => window.location.reload());
    if (!endJinglePlayed) {
      endJinglePlayed = true;
      if (screen === 'won') playWin();
      else playLose();
    }
  }
}

function startDuel() {
  unlockAudio();
  screen = 'play';
  paint();
}

if (shot) {
  const staged = stageShot(shot, seed);
  game = staged.game;
  screen = staged.screen;
  input = makeInput(game, paint);
  input.attach();
  paint();
  window.__shot = { shot, screen, turn: game.turn, playerFlame: game.player.flame, enemyFlame: game.enemy.flame };
  window.__shotReady = true;
} else {
  game = newGame(seed);
  screen = 'title';
  input = makeInput(game, paint);
  input.attach();
  paint();
  window.__shotReady = true;
}

document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });
