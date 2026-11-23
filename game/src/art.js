// Ember Court — card art, drawn by the game itself.
//
// Every card face carries a small canvas painting: a radial ember
// glow, the court's own motif — flame tongues for Ember, rolling
// waves for Tide, crossing thorns for Thorn, wind streaks for Gale —
// and the court's glyph stamped large in the middle. No images are
// fetched; the art is painted fresh by this module for each card, so
// each court reads by colour, by shape and by pattern at a glance.
//
// The motif is seeded per card id, so the same card always paints
// the same art.

import { COURTS } from './config.js';
import { makeRng } from './random.js';

function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function flameTongues(ctx, w, h, rng, color, glow) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i += 1) {
    const x = w * (0.15 + rng() * 0.7);
    const base = h * (0.55 + rng() * 0.4);
    const height = h * (0.35 + rng() * 0.45);
    const width = w * (0.12 + rng() * 0.1);
    ctx.globalAlpha = 0.35 + rng() * 0.4;
    ctx.beginPath();
    ctx.moveTo(x - width, base);
    ctx.quadraticCurveTo(x - width * 0.4, base - height * 0.6, x, base - height);
    ctx.quadraticCurveTo(x + width * 0.4, base - height * 0.6, x + width, base);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  void glow;
}

function waves(ctx, w, h, rng, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let row = 0; row < 3; row += 1) {
    const y = h * (0.25 + row * 0.25);
    ctx.globalAlpha = 0.4 + row * 0.18;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const yy = y + Math.sin((x / w) * Math.PI * 2.2 + row * 1.4 + rng() * 0.2) * h * 0.09;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function thorns(ctx, w, h, rng, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i += 1) {
    const x0 = rng() * w;
    const y0 = h;
    const x1 = x0 + (rng() - 0.5) * w * 0.5;
    const y1 = h * (0.15 + rng() * 0.3);
    ctx.globalAlpha = 0.45 + rng() * 0.35;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + (rng() - 0.5) * 20, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
    // A barb on the stem.
    ctx.beginPath();
    ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
    ctx.lineTo((x0 + x1) / 2 + 7, (y0 + y1) / 2 - 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function wind(ctx, w, h, rng, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i += 1) {
    const y = h * (0.15 + rng() * 0.7);
    const x0 = rng() * w * 0.3;
    const len = w * (0.5 + rng() * 0.4);
    ctx.globalAlpha = 0.4 + rng() * 0.4;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo(x0 + len * 0.5, y - 6 - rng() * 8, x0 + len, y + (rng() - 0.5) * 10);
    ctx.stroke();
    // A curl at the end of the gust.
    ctx.beginPath();
    ctx.arc(x0 + len, y, 4, -Math.PI * 0.6, Math.PI * 0.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

const MOTIFS = { flame: flameTongues, wave: waves, thorn: thorns, wind };

// Paint the art for one card into a fresh canvas and return it.
// `width`/`height` are the CSS-pixel size of the art window.
export function paintCardArt(def, width, height) {
  const court = COURTS[def.court];
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(width * 2));
  canvas.height = Math.max(2, Math.round(height * 2));
  canvas.className = 'art-canvas';
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const w = width;
  const h = height;

  // Deep ground, court-tinted, with a glow rising from below.
  const ground = ctx.createLinearGradient(0, 0, 0, h);
  ground.addColorStop(0, court.dark);
  ground.addColorStop(1, '#14100c');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.85, 2, w / 2, h * 0.85, w * 0.75);
  glow.addColorStop(0, court.glow + 'aa');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // The court's motif, seeded so the card always paints the same.
  const rng = makeRng(hashSeed(def.id));
  const motif = MOTIFS[court.motif] ?? flameTongues;
  motif(ctx, w, h, rng, court.color, court.glow);

  // The court's glyph, large and glowing, centred.
  ctx.font = `800 ${Math.round(h * 0.52)}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = court.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = court.color;
  ctx.fillText(court.glyph, w / 2, h * 0.46);
  ctx.shadowBlur = 0;

  // A faint ring frames the glyph, like a court's seal.
  ctx.strokeStyle = court.color + '88';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.46, h * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}
