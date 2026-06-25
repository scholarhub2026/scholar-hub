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
app.use(
  cors({
    origin: [
      'http://localhost:8080',
      'https://www.scholarhub.live',
      'https://0tlftd5r-8080.inc1.devtunnels.ms',
      'http://192.168.1.15:8080',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
