import mongoose from 'mongoose'

/**
 * Hide the password in a Mongo URI so it's safe to print in logs.
 * mongodb+srv://user:pass@host/db  ->  mongodb+srv://user:***@host/db
 */
const maskUri = (uri: string): string =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/, '$1***$2')

/** Best-effort DB name from the URI, for a clear "which database am I on?" log. */
const dbNameFromUri = (uri: string): string => {
  const match = uri.match(/\/([^/?]+)(\?|$)/)
  return match?.[1] ?? '(default)'
}

export const connectDB = async () => {
  const uri = process.env.DATABASE_URL
  const env = process.env.NODE_ENV || 'development'

  if (!uri) {
    console.error(
      '❌ DATABASE_URL is not set. Add it to backend/.env for local dev, ' +
        'or to the host environment (e.g. Railway variables) for production.'
    )
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    // Never log the raw URI — it contains the password.
    console.log(
      `✅ MongoDB connected [env=${env}] [db=${dbNameFromUri(uri)}] → ${maskUri(uri)}`
    )
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    // Fail fast so the platform restarts / the error is visible, instead of
    // silently running a server with no database.
    process.exit(1)
  }
}
