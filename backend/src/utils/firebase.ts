/**
 * Firebase Admin bootstrap for push notifications (FCM).
 *
 * SETUP (one-time):
 *   1. Create a Firebase project → Project settings → Service accounts →
 *      "Generate new private key". You get a JSON file.
 *   2. Install the SDK:  npm install firebase-admin
 *   3. Provide the credential via ONE of these env vars:
 *        FIREBASE_SERVICE_ACCOUNT  = the full service-account JSON on one line
 *                                    (recommended for Railway / hosted envs)
 *        GOOGLE_APPLICATION_CREDENTIALS = /absolute/path/to/serviceAccount.json
 *
 * If neither the package nor credentials are present, push is DISABLED and every
 * send becomes a no-op — the API keeps working, notifications just don't fire.
 */

let messaging: any = null
let initTried = false

const initFirebase = (): any => {
  if (initTried) return messaging
  initTried = true

  let admin: any
  try {
    // Indirect require so the build succeeds before `npm install firebase-admin`.
    const moduleName = 'firebase-admin'
    admin = require(moduleName)
  } catch {
    console.warn('[push] firebase-admin not installed — push notifications disabled')
    return null
  }

  try {
    if (!admin.apps.length) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT
      if (raw) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(raw)),
        })
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() })
      } else {
        console.warn('[push] No Firebase credentials set — push notifications disabled')
        return null
      }
    }
    messaging = admin.messaging()
    return messaging
  } catch (err: any) {
    console.error('[push] Firebase init failed:', err.message)
    return null
  }
}

export const getMessaging = (): any => initFirebase()

export const isPushEnabled = (): boolean => !!initFirebase()
