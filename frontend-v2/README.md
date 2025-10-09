# BrainBlitz - Frontend (Optimized)

This branch contains an automated modernization pass: TailwindCSS integration, responsive layout, lazy-loading improvements and performance hints targeted for mobile-first experiences.

What I changed
- Added TailwindCSS + PostCSS configs
- Created a responsive Layout (Navbar, Footer) using Tailwind utilities
- Migrated `HomePage` and `Ranking` to Tailwind utilities (mobile-first)
- Added lazy loading to avatar images
- Added preconnect/preload hints in `index.html`
- Kept original CSS files as fallback to avoid breaking styles

Quick start
1. Install dependencies:

```bash
npm install
```

2. Development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build:prod
```

Notes on Tailwind
- The Tailwind entry file is `src/styles/tailwind.css`. It's imported in `src/main.jsx` before the legacy `theme.css` so utilities are available while existing styles remain.
- `tailwind.config.js` contains content paths and a few extended colors used across components.

Performance & Lighthouse
- Added `preconnect` to Google Fonts and `preload` for the main module in `index.html`.
- Images in pages were marked `loading="lazy"` and `decoding="async"` where applicable.
- The project uses Vite which already generates optimized bundles for production. Run `npm run build:prod` and serve the `dist/` or use `npm run preview` to inspect.

Recommended next steps (manual)
- Convert static PNG/JPEG images in `public/` and `build/` to WebP and update references.
- Review `theme.css` and progressively migrate components to Tailwind classes, removing unused CSS.
- Run Lighthouse (Chrome DevTools > Lighthouse) and address remaining diagnostics (unused JS/CSS, large network payloads).
