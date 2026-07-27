# Funkin' Coding

Static site + live community chat for FNF engine modders (Psych Engine and V-Slice).

## Running locally

```
npm install
npm start
```

Then open `http://localhost:3000`.

`server.js` does two things:
- Serves the site itself (`index.html`, `login.js`, `community.js`, `manifest.json`, `sw.js`, `icons/`) as static files.
- Runs a WebSocket endpoint at `/ws/community` that powers the Community tab's live chat. Messages are broadcast to everyone connected and persisted to `community-messages.json` (created automatically) so history survives a server restart.

## Deploying

Any host that can run a long-lived Node.js process works (Render, Railway, Fly.io, a VPS, etc.) — this is not a static-only site anymore because of the chat feature, so plain static hosts (GitHub Pages, Netlify's default static hosting) won't run `server.js` or the WebSocket server.

Set the `PORT` environment variable if your host requires it; it defaults to `3000`.

## Google Sign-In

`login.js` needs a real Google OAuth Client ID to work. See the `GOOGLE_CLIENT_ID` constant at the top of that file — replace the placeholder with the Client ID from your project in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), and add your deployed domain to that Client ID's "Authorized JavaScript origins".

## Notes

- The Community tab falls back to a "Guest####" name (stored in `localStorage`) for anyone who hasn't signed in with Google.
- Chat messages are capped at 500 characters and the server only keeps the most recent 200 messages.
