import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import router from './routes/index.js'
import { connectDB } from './utils/db.js'
import nodemailer from 'nodemailer'
import { sendMail } from './utils/mailService.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// Allowed browser origins come from CORS_ORIGINS (comma-separated) so each
// environment (dev host / prod host / local) sets its own frontend URL.
// Falls back to the local Vite dev server if unset.
const allowedOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:8080,http://localhost:5173'
)
  .split(',')
  // trim + drop any trailing slash so "https://site/" matches the browser's
  // slash-less Origin header.
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

// Connect to DB
connectDB()

// Razorpay webhook route (raw body)
app.use(
  '/api/booking/razorpay/webhook',
  express.raw({ type: 'application/json' })
)


// Routes
app.use(router)

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
