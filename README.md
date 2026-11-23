# Ember Court

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/sixthin016/ember-court-v2/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/sixthin016/ember-court-v2/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Ember Court — 1-v-1 card duel: 24 cards, 4 courts, ember ramp 1–8, Guard + Swift, AI Ash Regent**

Ember Court is an original card duel: you, the Keeper, face the Ash Regent across a felt table. Each side guards 20 flame. Spend ember to play creatures and spells from four courts — Ember burns, Tide guards, Thorn endures, Gale tricks — break through Guards, then burn the Regent's flame to 0 before yours is gone. Every card's art is painted by the game's own canvas code, embers drift over the table, and every sound is synthesized live with WebAudio. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network: the game is plain static files under `game/`.

## How to play

- Each turn you gain ember (1 on turn 1, up to 8) and draw a card.
- Click a hand card to play it. Creatures join your board; spells ask for a target — an enemy minion, the Regent's flame, or your own flame for Healing Rain.
- Click one of your ready minions, then an enemy minion or the Regent's flame, to attack. A minion played this turn is drowsy and attacks next turn.
- Guards must be attacked before anything behind them. Combat is a trade: the attacker deals its attack, and a minion target strikes back.
- Swift cards draw a card the moment they are played.
- Win by reducing the Regent's flame to 0. Lose if yours reaches 0.
- Escape clears a selection; the ♪ button in the top bar toggles sound.

## The four courts

- **Ember ▲ red** — blunt, aggressive creatures and burn spells.
- **Tide ● blue** — guards that stand in the way, and healing.
- **Thorn ◆ green** — sturdy bodies that grow together.
- **Gale ✦ amber** — quick tricks that replace themselves.

The deck holds 24 different cards (one of each) plus a second copy of the four cheapest creatures, 28 cards in all. Every shuffle draws from a seeded RNG (`seed=1` by default, `?seed=N` in the URL), so the same seed always deals the same game — and the same screenshot.

## Screenshots

The four screenshots in `screenshots/` are real renders of the game in a desktop browser, staged by playing the real rules forward with a fixed seed (`node shots-driver.mjs`): the title screen, a mid-game table, the victory screen, and the defeat screen.

## Files

- `game/index.html` + `game/style.css` — the table and its look.
- `game/src/config.js` — the four courts and the 24 cards.
- `game/src/state.js` — the rules: turns, ember, combat, Guards.
- `game/src/ai.js` — the Ash Regent's play.
- `game/src/art.js` — card art painted on canvas, one motif per court.
- `game/src/particles.js` — embers drifting over the table.
- `game/src/sound.js` — WebAudio sounds, synthesized live.
- `game/src/render.js` — the table, the hands, the boards, the screens.
- `game/src/input.js` — mouse and keyboard play.
- `game/src/shots.js` — the four screenshot scenes, staged from the real rules.
- `game/src/random.js` — the seeded RNG behind every shuffle.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wffmhs5a&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
