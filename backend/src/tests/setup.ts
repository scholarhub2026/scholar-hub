import { beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Test env — set before the app/controllers read anything.
process.env.NODE_ENV = 'test'
process.env.AUTH_ENFORCED = 'true' // exercise the 401/403 role gating
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
process.env.RAZORPAY_KEY_ID = 'rzp_test_key'
process.env.RAZORPAY_SECRET_KEY = 'rzp_test_secret'
process.env.FRONTEND_URL = 'https://test.scholarhub.live'
process.env.CORS_ORIGINS = 'http://localhost:5173'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 120000)

// Isolate every test — wipe all collections between them.
afterEach(async () => {
  const { collections } = mongoose.connection
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})
