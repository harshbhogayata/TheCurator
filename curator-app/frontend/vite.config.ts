import { defineConfig, loadEnv } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
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

/** Let project `.env` win over inherited shell env (common source of stale dev flags). */
function applyProjectEnv(mode: string) {
  if (mode !== 'development') return

  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue

    const key = trimmed.slice(0, eq).trim()
    if (!key.startsWith('VITE_')) continue

    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

export default defineConfig(({ mode }) => {
  applyProjectEnv(mode)
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
