import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import router from './routes/index.js'

/**
 * Builds the Express app WITHOUT connecting to the DB or listening, so it can be
 * imported directly by the test suite (supertest) as well as by the server
 * entrypoint (`index.ts`). Middleware order is kept identical to the original.
 */
export const createApp = () => {
  const app = express()

  app.use(express.json({ limit: '10mb' }))
  // Request logging is noise in tests; keep it for the real server only.
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

  const allowedOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:8080,http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  )

  // Razorpay webhook needs the raw body for signature verification.
  app.use(
    '/api/booking/razorpay/webhook',
    express.raw({ type: 'application/json' })
  )

  app.use(router)

  return app
}

export default createApp
