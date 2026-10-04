/* AgentFOXXY — site behaviour: data rendering, nav, tabs, filters, copy, reveal, 3D wiring.

   cursor.js and fox.js are imported dynamically so a WebGL/library failure can never
   take the content down with it. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════ data (verbatim from the project README) ═══════════ */

const POWERS = [
  ['web', '🔍', 'Web Search &amp; Scraping', 'Search Google, Bing, DuckDuckGo. Open any URL. Extract text, data and images from any page.'],
  ['web', '🌐', 'Browser Automation', 'A real browser: navigate, click, fill forms, type, scroll, screenshot, log in.'],
  ['web', '🐦', 'X (Twitter) Search', 'Search posts on X, find trending topics, your own posts and conversations.'],
  ['build', '💻', 'Terminal &amp; Process Control', 'Run any shell command. Start, stop and monitor processes. Full terminal access.'],
  ['build', '📁', 'File Operations', 'Read, write, create, delete, move, rename, search and patch files system-wide.'],
  ['build', '⚡', 'Code Execution', 'Python, JavaScript, Bash and more — run it, fix errors, edit whole projects.'],
  ['build', '📋', 'Task Planning', 'Break big jobs into steps, track progress, plan before acting.'],
  ['build', '🧩', 'Context Engine', 'Dynamically loads the right tools and context for what you are working on.'],
  ['media', '👁️', 'Vision / Image Analysis', 'Describe images, read text from screenshots, compare images, detect objects.'],
  ['media', '🎬', 'Video Analysis', 'Watch and understand video. Extract frames, describe scenes, find the moment.'],
  ['media', '🎨', 'Image Generation', 'Images from text with DALL·E, Stable Diffusion and more.'],
  ['media', '🎥', 'Video Generation', 'Video from text prompts with AI video models.'],
  ['media', '🔊', 'Text-to-Speech', 'Any text to spoken audio, multiple voices and languages.'],
  ['media', '🎙️', 'Speech-to-Text', 'Transcribe audio and voice recordings, many languages.'],
  ['brain', '📚', 'Skills System', 'Saves the method when it solves something hard. 16 built in + 21 optional packs.'],
  ['brain', '💾', 'Persistent Memory', 'Notes, preferences and project context survive closing the terminal.'],
  ['brain', '🔎', 'Session Search', 'Search every past conversation — find last week’s command in one search.'],
  ['brain', '❓', 'Clarifying Questions', 'Asks smart follow-ups when a job is unclear instead of guessing wrong.'],
  ['scale', '👥', 'Task Delegation (TeamFOXXY)', 'Split big jobs across multiple agents running at the same time.'],
  ['scale', '⏰', 'Cron Jobs', '“Every morning at 8am…” — recurring tasks in plain words, no cron syntax.'],
  ['world', '🖱️', 'Computer Use', 'Full desktop control: mouse, keyboard, screen — like a human at your machine.'],
  ['world', '📱', 'Messaging Platforms', 'Telegram, Discord, Slack, WhatsApp and Signal — same agent, same memory.'],
  ['world', '🏠', 'Home Assistant', 'Lights, sensors and automations through natural language.'],
  ['world', '🎵', 'Spotify Integration', 'Playback, search, playlists and library — hands free.'],
  ['world', '💬', 'Discord Integration', 'Fetch messages, search members, create threads, run as a Discord bot.'],
  ['world', '🛡️', 'Discord Server Admin', 'List channels and roles, pin messages, assign roles.'],
  ['world', '🤖', 'Yuanbao Integration', 'Group info, member queries and DMs through the Yuanbao platform.'],
  ['ext', '🔌', 'MCP (Model Context Protocol)', 'Plug in any MCP-compatible server to add even more powers.'],
  ['ext', '🧠', '35+ AI Model Providers', 'OpenAI, Anthropic, Gemini, DeepSeek, Ollama and more — switch with one command.'],
];

const COMPARE = [
  ['Price', 'Free forever', 'Free', 'Paid subscription', 1],
  ['Open source', 'MIT', 'MIT', 'Closed source', 2],
  ['AI providers', '35+ (OpenAI, Gemini, DeepSeek, Ollama…)', '35+', 'Anthropic only', 1],
  ['Autonomous from day one', 'Yes', 'No', 'Yes', 2],
  ['Self-improving (saves skills)', 'Learns and reuses solutions', 'Yes', 'No', 2],
  ['Built-in powers', '40+', '30+', '~15', 1],
  ['Real browser automation', 'See, click, type, log in', 'Yes', 'No', 2],
  ['Full desktop control', 'Mouse, keyboard, screen', 'Yes', 'No', 2],
  ['Generate images &amp; video', 'DALL·E, Stable Diffusion, etc.', 'Yes', 'No', 2],
  ['Text-to-speech &amp; speech-to-text', 'Yes', 'Yes', 'No', 2],
  ['Message from phone', 'Telegram, Discord, Slack, WhatsApp, Signal', 'Yes', 'No', 2],
  ['Cron jobs (plain words)', 'Yes', 'Yes', 'No', 2],
  ['Smart home control', 'Home Assistant', 'Yes', 'No', 2],
  ['Spotify control', 'Yes', 'Yes', 'No', 2],
  ['Multi-agent swarm', 'TeamFOXXY', 'Yes', 'No', 2],
  ['Windows desktop app', 'Yes', 'No', 'No', 2],
  ['Runs on Android (Termux)', 'Yes', 'Yes', 'No', 2],
  ['MCP protocol', 'Yes', 'Yes', 'Yes', 0],
  ['Run fully offline (Ollama)', 'Nothing leaves your machine', 'Yes', 'No', 2],
  ['Persistent memory', 'Yes', 'Yes', 'No', 2],
  ['Search past conversations', 'Yes', 'Yes', 'No', 2],
];

const PROVIDERS = ['OpenAI', 'Anthropic', 'Google Gemini', 'DeepSeek', 'Qwen', 'xAI Grok', 'AWS Bedrock',
  'Azure OpenAI', 'OpenRouter', 'Ollama', 'Mistral', 'Cohere', 'Together AI', 'Any OpenAI-compatible endpoint'];

const MARQUEE = ['Browser automation', 'Desktop control', 'Persistent memory', 'Self-improving skills', 'TeamFOXXY swarm',
  'Telegram · Discord · Slack', 'WhatsApp · Signal', 'MCP protocol', 'Image & video generation', 'Speech in and out',
  'Cron in plain words', 'Home Assistant', 'Spotify', '35+ providers', 'Runs offline', 'MIT licensed'];

/* ═══════════ render ═══════════ */

function renderPowers() {
  const grid = $('#powers-grid');
  if (!grid) return;
  grid.innerHTML = POWERS.map(([cat, ico, title, desc]) => `
    <article class="power reveal" data-cat="${cat}">
      <div class="power__ico" aria-hidden="true">${ico}</div>
      <div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
      <span class="power__tag">${cat}</span>
    </article>`).join('');
}

function renderCompare() {
  const body = $('#cmp-body');
  if (!body) return;
  const cell = (v) => {
    if (v === 0) return '<span class="no">—</span>';
    if (v === 1) return '<span class="yes">✅</span>';
    return String(v);
  };
  body.innerHTML = COMPARE.map(([feat, a, b, c]) => `
    <tr><td>${feat}</td><td class="is-us">${cell(a)}</td><td>${cell(b)}</td><td>${cell(c)}</td></tr>`).join('');
}

function renderLists() {
  const prov = $('#providers-list');
  if (prov) prov.innerHTML = PROVIDERS.map((p) => `<li>${p}</li>`).join('');

  const mq = $('#marquee');
  if (mq) {
    const row = MARQUEE.map((t) => `<span>${t}</span>`).join('');
    mq.innerHTML = row + row; // duplicated for a seamless -50% loop
  }
}

/* ═══════════ behaviour ═══════════ */

function nav() {
  const bar = $('#nav');
  const prog = $('.nav__progress i');
  const onScroll = () => {
    const y = scrollY;
    bar.classList.toggle('is-stuck', y > 12);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('.nav__burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = bar.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__links a').forEach((a) => a.addEventListener('click', () => {
      bar.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }
}

function reveal() {
  const items = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const pending = new Set(items);
  const show = (el) => { el.classList.add('is-in'); pending.delete(el); };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) show(en.target); });
    if (!pending.size) io.disconnect();
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  items.forEach((el) => io.observe(el));

  /* Safety net: IO only reports on delivery frames, so a fast flick, a
     End-key jump or a hash link can skip an element entirely and leave a
     whole section stuck at opacity 0. Sweep whatever is already in view. */
  let queued = false;
  const sweep = () => {
    queued = false;
    const h = innerHeight;
    for (const el of [...pending]) {
      if (el.getBoundingClientRect().top < h * 0.94) show(el);
    }
    if (!pending.size) {
      removeEventListener('scroll', onScroll);
      io.disconnect();
    }
  };
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('scrollend', sweep, { passive: true });
  addEventListener('hashchange', sweep, { passive: true });
}

function counters() {
  const els = $$('.count');
  const run = (el) => {
    const to = Number(el.dataset.to) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = to + suffix; return; }
    const dur = 1400;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) return els.forEach(run);
  const io = new IntersectionObserver((en) => en.forEach((e) => {
    if (!e.isIntersecting) return;
    run(e.target);
    io.unobserve(e.target);
  }), { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

function copyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target instanceof Element ? e.target.closest('.copy') : null;
    if (!btn) return;
    const sel = btn.dataset.copy;
    const text = sel ? ($(sel)?.textContent ?? '') : (btn.dataset.copyText || '');
    if (!text.trim()) return;
    const ok = await copyText(text.trim());
    const label = btn.textContent;
    btn.classList.add('is-copied');
    btn.textContent = ok ? 'Copied' : 'Press ⌘C';
    if (btn.classList.contains('btn')) btn.setAttribute('aria-label', 'Install command copied');
    setTimeout(() => { btn.classList.remove('is-copied'); btn.textContent = label; }, 1600);
  });
}

function tabs() {
  $$('[data-tabs]').forEach((root) => {
    const list = $$('.tab', root);
    const select = (i) => {
      list.forEach((tab, n) => {
        const on = n === i;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; panel.classList.toggle('is-on', on); }
      });
    };
    list.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const n = (i + dir + list.length) % list.length;
        select(n);
        list[n].focus();
      });
    });
  });
}

function filters() {
  const chips = $$('.chip');
  if (!chips.length) return;
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('is-on', c === chip));
    const f = chip.dataset.filter;
    $$('#powers-grid .power').forEach((card) => {
      card.classList.toggle('is-hidden', f !== 'all' && card.dataset.cat !== f);
    });
  }));
}

function spotlight() {
  if (!matchMedia('(hover: hover)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target instanceof Element ? e.target.closest('.card') : null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

function three(initScene) {
  const canvas = $('#gl');
  if (!canvas) return;
  let scene;
  try {
    scene = initScene(canvas);
  } catch (err) {
    console.warn('[foxxy] scene failed:', err);
    document.documentElement.classList.add('no-gl');
    return;
  }
  if (scene.fail) { document.documentElement.classList.add('no-gl'); return; }
  canvas.classList.add('is-live');

  const hero = $('.hero');
  if (hero && scene.setScroll) {
    const onScroll = () => {
      const h = hero.offsetHeight || 1;
      const p = Math.min(1.4, scrollY / h);
      scene.setScroll(p);
      // wordmark holds in the hero, then dissolves into the swarm
      scene.setMorph(Math.max(0, Math.min(1, (scrollY - h * 0.1) / (h * 0.55))));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

/* ═══════════ boot ═══════════ */
async function boot() {
  renderPowers();
  renderCompare();
  renderLists();
  nav();
  reveal();
  counters();
  copyButtons();
  tabs();
  filters();
  spotlight();

  // progressive enhancement: cursor + WebGL are optional
  try {
    const { initCursor } = await import('./cursor.js');
    initCursor();
  } catch (err) {
    console.warn('[foxxy] cursor unavailable:', err);
  }

  try {
    const { initScene } = await import('./fox.js');
    three(initScene);
  } catch (err) {
    console.warn('[foxxy] 3D unavailable:', err);
    document.documentElement.classList.add('no-gl');
  }

  document.documentElement.classList.add('is-ready');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
