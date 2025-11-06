# eBook Evolution - CIMA Embedded App (Full Repo)

Vanilla JS + Netlify Functions prototype for an in-CIMA eBook experience.

## Highlights
- Renders attached prototype chapter PDF inline using PDF.js
- Search within chapter, notes/highlights store, TTS, contrast and font size
- Time-on-task heartbeats and completion
- Assistant context and bookmarks
- Permissions check hook and simple non-download "DRM-ish" rendering
- All endpoints as Netlify Functions

## Local Dev
- Install Netlify CLI: `npm i -g netlify-cli`
- Run: `netlify dev`
- The app will be served at http://localhost:8888 with functions proxied at /api/*

## Deploy
- Connect to Netlify, set env vars as needed, deploy.
