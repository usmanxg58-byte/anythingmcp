# AgentFOXXY — website

Static marketing site for [AgentFOXXY](https://github.com/usmanxg58-byte/AgentFOXXY): a 3D-animated
landing page with a custom cursor, built from the project's own README.

**No build step. No framework. No CDN.** Plain HTML + CSS + ES modules with
[three.js](https://threejs.org) vendored into `vendor/three/` (MIT licence, included). Drop the
folder on any static host and it works.

```
agentfoxxy-site/
├── index.html              # whole page + content structure
├── .nojekyll               # keeps GitHub Pages from filtering files
├── assets/
│   ├── css/style.css       # design system, layout, components
│   └── js/
│       ├── main.js         # content data, nav, tabs, filters, copy, reveals
│       ├── fox.js          # WebGL scene (text particles → swarm → core → bloom)
│       └── cursor.js       # custom cursor: spring ring, trail, hover/magnet states
└── vendor/three/           # three.js r169 + the postprocessing passes used
```

## Run locally

ES modules need HTTP (not `file://`):

```bash
python3 -m http.server 4173
# → http://127.0.0.1:4173
```

## What is in the 3D scene

One `WebGLRenderer` + `EffectComposer` with `UnrealBloomPass`, four layers:

| Layer | What it does |
|---|---|
| Text particles | The word `FOXXY` is rasterised into a 2D canvas, sampled to ~5k points, then morphed into an orbiting swarm by a GLSL uniform |
| Shard swarm | 900 instanced tetrahedra on independent orbits, pushed away from the cursor |
| Core | Icosahedron displaced by 3D simplex noise, normals re-derived by finite differences, fresnel rim |
| Starfield | 2 200 additive points with parallax |

Scroll drives camera dolly and the wordmark → swarm morph. Pointer parallax, repel field and
cursor-lean are live. If FPS drops below 26 the renderer degrades itself: bloom off, DPR → 1.

## Behaviour

- **Custom cursor** — 7-dot comet trail, spring-follow ring, fox glyph that leans into the direction
  of travel, hover/press/text states, magnetic buttons. Desktop pointers only; touch and
  `prefers-reduced-motion` users keep their native cursor.
- **Reveals** — IntersectionObserver plus a scroll sweep, so a fast flick, `End` key or hash link
  can never leave a section stuck invisible.
- **Copy buttons** — every command block, with a clipboard fallback for non-secure contexts.
- **Filters / tabs** — powers categories, three install methods with arrow-key support.
- **Fallbacks** — reduced-motion renders one static frame; no WebGL adds `no-gl` to `<html>` and the
  page stays fully readable; `prefers-contrast: more` and print styles included.

## Deploy

The site is fully static and relative-pathed, so it works at a domain root or a subpath
(`/AgentFOXXY/`). All four of these are one-time clicks:

**GitHub Pages** — from a fork of the repo: *Settings → Pages → Source: Deploy from a branch →
`main` / `/ (root)`*. Add a workflow instead if you prefer:

```yaml
# .github/workflows/pages.yml
name: deploy site
on:
  push: { branches: [main], paths: ['agentfoxxy-site/**'] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    environment: { name: github-pages, url: '${{ steps.deploy.outputs.page_url }}' }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: agentfoxxy-site }
      - id: deploy
        uses: actions/deploy-pages@v4
```

**Netlify** — <https://app.netlify.com/drop>: drag the `agentfoxxy-site` folder onto the page.
Publish directory = `agentfoxxy-site`.

**Cloudflare Pages** — *Create project → Upload assets*, build command empty, output directory
`agentfoxxy-site`.

**Vercel** — `npx vercel deploy agentfoxxy-site --prod` (framework preset: *Other*).

**Anywhere else** — nginx `root /var/www/agentfoxxy;`, S3 + CloudFront, or any object store. Only
requirement: serve `.js` as `application/javascript`.

## Accuracy

Copy, install commands, the comparison matrix and the power list come from the project README
(AGPL/AGPL-3.0 repo, MIT-licensed agent). The comparison table is the project's own matrix, and the
page links to the repo as canonical rather than claiming a domain it does not own.