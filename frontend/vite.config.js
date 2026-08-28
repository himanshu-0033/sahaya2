import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned, and strict about it.
    //
    // Google's OAuth client authorises exact JavaScript origins. Vite's
    // default is to take the next free port when 5173 is busy — a second
    // `npm run dev`, a stale process — so the app quietly comes up on 5177 and
    // Google answers the sign-in with "Error 400: origin_mismatch", which
    // reads like a broken client id rather than a wrong port. Failing to start
    // is the better outcome: it says which port is occupied, and it says it
    // before anybody tries to sign in.
    //
    // http://localhost:5173 has to be listed under "Authorised JavaScript
    // origins" on the OAuth client in the Google Cloud Console for sign-in to
    // work at all. Nothing in this repo can add it.
    port: 5173,
    strictPort: true,
    proxy: {
      // More specific first: the agent module owns /api/chat on its own port.
      '/api/chat': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
