// Ember Court — ember particles drifting over the table.
//
// A full-table canvas sits behind the cards and above the felt: tiny
// embers rise from the bottom edge, wobble, brighten and fade. The
// particle set is seeded, so a screenshot staged from a fixed seed
// always shows the same drift. The loop runs on requestAnimationFrame
// and pauses when the tab is hidden; it costs almost nothing, and it
// is what makes the table feel lit rather than painted.

import { makeRng } from './random.js';

const COUNT = 42;

let canvas = null;
let ctx = null;
let particles = [];
let raf = 0;
let last = 0;
let width = 0;
let height = 0;
let respawnRng = null;

function spawn(rng, initial) {
  return {
    x: rng() * width,
    y: initial ? rng() * height : height + 6 + rng() * 20,
    size: 1 + rng() * 2.6,
    speed: 12 + rng() * 26,
    drift: (rng() - 0.5) * 14,
    phase: rng() * Math.PI * 2,
    life: rng(),
    hue: 18 + rng() * 26,
  };
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  ctx.clearRect(0, 0, width, height);
  for (const p of particles) {
    p.y -= p.speed * dt;
    p.x += (p.drift + Math.sin(now / 700 + p.phase) * 8) * dt;
    p.life += dt * 0.25;
    if (p.y < -8 || p.life > 1) {
      Object.assign(p, spawn(respawnRng, false));
      p.life = 0;
      p.y = height + 6;
    }
    const alpha = Math.sin(p.life * Math.PI) * 0.85;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = `hsl(${p.hue} 95% 60%)`;
    ctx.shadowColor = '#ff7a3c';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// Start the particle layer on `host` (the #table element). The canvas
// is positioned by CSS; this only sizes it and starts the loop. The
// table's DOM is rebuilt on every repaint, which detaches the canvas:
// when that happens this re-attaches the same canvas instead of
// starting a second loop.
export function startParticles(host, seed = 1) {
  if (canvas && canvas.isConnected) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'embers';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    respawnRng = makeRng(seed * 7919 + 13);
  }
  host.append(canvas);
  const resize = () => {
    width = host.clientWidth;
    height = host.clientHeight;
    canvas.width = width;
    canvas.height = height;
  };
  resize();
  window.addEventListener('resize', resize);
  if (particles.length === 0) {
    const rng = makeRng(seed * 7919 + 13);
    particles = Array.from({ length: COUNT }, () => spawn(rng, true));
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

export function stopParticles() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (canvas) canvas.remove();
  canvas = null;
}
