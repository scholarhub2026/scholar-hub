import { createApp } from './app.js'
import { connectDB } from './utils/db.js'

const app = createApp()
const PORT = process.env.PORT || 5000

// Connect to DB
connectDB()

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
