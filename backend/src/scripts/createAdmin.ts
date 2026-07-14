/**
 * One-off script to create (or promote) an ADMIN account — the first login for
 * the admin console. Public signup only makes STUDENTs, so use this to bootstrap.
 *
 * Usage (from the backend/ folder):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPass123 npm run seed:admin
 *
 * If the email already exists it is promoted to ADMIN and its password reset.
 */
import mongoose from 'mongoose'
import AuthModal from '../models/Auth'
import { encryptPassword } from '../helpers/Auth'
import { generateReferralCode } from '../utils/referral'

const run = async () => {
  const uri = process.env.DATABASE_URL
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!uri) {
    console.error('❌ DATABASE_URL is not set (check backend/.env).')
    process.exit(1)
  }
  if (!email || !password) {
    console.error(
      '❌ Provide ADMIN_EMAIL and ADMIN_PASSWORD, e.g.\n' +
        '   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPass123 npm run seed:admin'
    )
    process.exit(1)
  }
  if (password.length < 6) {
    console.error('❌ ADMIN_PASSWORD must be at least 6 characters.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const hashed = await encryptPassword(password)
  const existing = await AuthModal.findOne({ email })

  if (existing) {
    existing.role = 'ADMIN'
    existing.password = hashed
    existing.emailVerified = true
    existing.isActive = true
    await existing.save()
    console.log(`✅ Promoted existing user ${email} to ADMIN and reset password.`)
  } else {
    await AuthModal.create({
      email,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      password: hashed,
      emailVerified: true,
      isActive: true,
      completed_profile: true,
      referralCode: await generateReferralCode(),
    })
    console.log(`✅ Created ADMIN account ${email}.`)
  }

  console.log('   You can now log in at /login and land on the admin console.')
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Failed to create admin:', err)
  process.exit(1)
})
