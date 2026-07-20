import { defineConfig } from 'vitest/config'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const stub = (name: string) => path.resolve(root, 'src/tests/stubs', `${name}.ts`)

// Modules replaced with test stubs (crash-on-import or external network calls).
const STUBS: Array<[RegExp, string]> = [
  [/^jsonwebtoken$/, stub('jsonwebtoken')],
  [/^razorpay$/, stub('razorpay')],
  // Match both '../utils/mailService' (controllers) and './mailService'
  // (siblings inside utils/) — there is only one module with each name.
  [/(^|\/)mailService(\.js)?$/, stub('mailService')],
  [/(^|\/)pushService(\.js)?$/, stub('pushService')],
]

// The backend is NodeNext ESM: source files import each other with `.js`
// extensions (e.g. `./routes/index.js`). Vite doesn't rewrite those to the
// real `.ts` sibling, so do it here — and swap in stubs first.
const nodeNextResolver = () => ({
  name: 'nodenext-js-to-ts',
  enforce: 'pre' as const,
  resolveId(source: string, importer?: string) {
    for (const [re, file] of STUBS) if (re.test(source)) return file
    if (importer && source.startsWith('.') && source.endsWith('.js')) {
      const abs = path.resolve(path.dirname(importer), source)
      const tsPath = abs.replace(/\.js$/, '.ts')
      if (fs.existsSync(tsPath)) return tsPath
    }
    return null
  },
})

export default defineConfig({
  plugins: [nodeNextResolver()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false, // single in-memory Mongo shared across files
    pool: 'forks',
  },
})
