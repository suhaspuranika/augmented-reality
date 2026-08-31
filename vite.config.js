import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// WebXR (AR) requires HTTPS, even on localhost / LAN.
// basicSsl gives a self-signed cert for local phone testing over the network.
// It is only needed in dev; on Vercel the platform provides real HTTPS.
export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5173,
  },
}))
