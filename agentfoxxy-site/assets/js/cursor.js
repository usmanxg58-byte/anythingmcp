/* AgentFOXXY — custom cursor
   Spring-follow ring + comet trail + fox glyph, with hover / press / text states. */

const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TRAIL = 7;

const FOX = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 5l7 5M28 5l-7 5"/><path d="M16 10c5 0 9 4 9 9s-4 8-9 8-9-3-9-8 4-9 9-9Z"/>
<path d="M11.6 18.4l2.1 2.2M20.4 18.4l-2.1 2.2"/><path d="M16 23.4l-1.5 1.3M16 23.4l1.5 1.3"/></svg>`;

export function initCursor() {
  if (!fine || reduced) return;
  const layer = document.querySelector('.cursor-layer');
  if (!layer) return;

  document.documentElement.classList.add('has-cursor');

  const el = (cls, html) => {
    const d = document.createElement('div');
    d.className = `cur ${cls}`;
    if (html) d.innerHTML = html;
    layer.appendChild(d);
    return d;
  };

  const trail = Array.from({ length: TRAIL }, (_, i) => {
    const d = el('cur--trail');
    d.style.setProperty('--i', String(TRAIL - i));
    return { node: d, x: innerWidth / 2, y: innerHeight / 2 };
  });
  const ring = el('cur--ring');
  const dot = el('cur--dot');
  const fox = el('cur--fox', FOX);

  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my, dx = mx, dy = my;
  let ang = 0, raf = 0, live = true;

  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; live = true; }, { passive: true });
  addEventListener('pointerdown', (e) => {
    layer.classList.add('is-down');
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    layer.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }, { passive: true });
  addEventListener('pointerup', () => layer.classList.remove('is-down'), { passive: true });
  document.addEventListener('pointerleave', () => { live = false; layer.classList.add('is-hidden'); });
  document.addEventListener('pointerenter', () => { live = true; layer.classList.remove('is-hidden'); });
  addEventListener('blur', () => layer.classList.add('is-hidden'));

  const HOVER = 'a, button, summary, [data-cursor], .power, .card, .chip, input, select, textarea, label';
  document.addEventListener('pointerover', (e) => {
    const t = e.target instanceof Element ? e.target.closest(HOVER) : null;
    layer.classList.toggle('is-hover', !!t);
    const field = e.target instanceof Element ? e.target.closest('input, textarea, [contenteditable]') : null;
    layer.classList.toggle('is-text', !!field);
  }, { passive: true });

  // magnetic buttons
  const magnets = [...document.querySelectorAll('.magnetic')];
  const reset = (el) => el.style.removeProperty('translate');
  document.addEventListener('pointermove', (e) => {
    for (const m of magnets) {
      const r = m.getBoundingClientRect();
      if (r.width === 0) continue;
      const inside = e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
      if (!inside) { reset(m); continue; }
      m.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.16}px ${(e.clientY - (r.top + r.height / 2)) * 0.22}px`;
    }
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    if (e.target instanceof Element) {
      const m = e.target.closest('.magnetic');
      if (m) reset(m);
    }
  }, { passive: true });

  const place = (node, x, y) => node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

  const loop = () => {
    raf = requestAnimationFrame(loop);
    // ring: softer spring · dot: tight · trail: staggered
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    dx += (mx - dx) * 0.42;
    dy += (my - dy) * 0.42;

    let px = rx, py = ry;
    for (const t of trail) {
      t.x += (px - t.x) * 0.34;
      t.y += (py - t.y) * 0.34;
      place(t.node, t.x, t.y);
      px = t.x; py = t.y;
    }

    place(ring, rx, ry);
    place(dot, dx, dy);
    place(fox, rx, ry);

    // fox glyph leans into the direction of travel
    const vx = mx - rx, vy = my - ry;
    const speed = Math.hypot(vx, vy);
    const target = Math.max(-38, Math.min(38, vx * 0.32));
    ang += (target - ang) * 0.12;
    fox.style.rotate = `${ang}deg`;
    if (!layer.classList.contains('is-hover')) fox.style.opacity = String(Math.min(1, 0.25 + speed / 26));
  };
  raf = requestAnimationFrame(loop);

  addEventListener('pagehide', () => { cancelAnimationFrame(raf); layer.remove(); document.documentElement.classList.remove('has-cursor'); });
}
