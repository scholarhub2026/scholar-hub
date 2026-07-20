import { createApp } from './app.js'
import { connectDB } from './utils/db.js'
import { startPaymentReminderJob } from './jobs/paymentReminderJob.js'
import { startInvoiceGenerationJob } from './jobs/invoiceGenerationJob.js'

const app = createApp()
const PORT = process.env.PORT || 5000

// Connect to DB
connectDB()

// Daily crons: invoice generation (08:00 IST) then payment-due reminders
// (09:00 IST). Skipped in tests; set DISABLE_CRON=true on extra replicas.
if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_CRON !== 'true') {
  startInvoiceGenerationJob()
  startPaymentReminderJob()
}

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
