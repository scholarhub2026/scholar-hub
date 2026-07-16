import { createApp } from './app.js'
import { connectDB } from './utils/db.js'
import { startPaymentReminderJob } from './jobs/paymentReminderJob.js'

const app = createApp()
const PORT = process.env.PORT || 5000

// Connect to DB
connectDB()

// Daily payment-due reminders (push + email). Skipped in tests; set
// DISABLE_CRON=true to turn off on extra replicas.
if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_CRON !== 'true') {
  startPaymentReminderJob()
}

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
