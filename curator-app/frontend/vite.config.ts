import { defineConfig, loadEnv } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const requiredProductionEnv = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

function isPlaceholder(value: string): boolean {
  return !value || /^(change-me|changeme|your-|<)/i.test(value)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://127.0.0.1:8000'

  if (mode === 'production') {
    const missing = requiredProductionEnv.filter((key) => isPlaceholder(env[key]?.trim() ?? ''))
    if (missing.length > 0) {
      throw new Error(`Production web build is missing required env: ${missing.join(', ')}`)
    }

    const apiUrl = new URL(apiTarget)
    const isLocalApi = ['127.0.0.1', 'localhost', '::1'].includes(apiUrl.hostname)
    if (apiUrl.protocol !== 'https:' && !isLocalApi) {
      throw new Error('Production VITE_API_URL must use HTTPS.')
    }
  }

  return {
    plugins: [reactRouter(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
