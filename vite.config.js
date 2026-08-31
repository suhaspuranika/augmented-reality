import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// WebXR (AR) requires HTTPS, even on localhost / LAN.
// basicSsl gives us a self-signed cert so we can test on a phone over the network.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
})
