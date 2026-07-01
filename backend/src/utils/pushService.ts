import Auth from '../models/Auth'
import { getMessaging } from './firebase'

export interface PushPayload {
  title: string
  body: string
  /** Optional key/value data delivered to the app for deep-linking. */
  data?: Record<string, string>
}

/** Send a push to every device a single user is logged in on. */
export const sendPushToUser = async (
  userId: string,
  payload: PushPayload
): Promise<void> => {
  if (!getMessaging()) return

  const user = await Auth.findById(userId).select('fcmTokens')
  await sendToTokens(user?.fcmTokens ?? [], payload, userId)
}

/** Send a push to every user of a given role (e.g. every ADMIN). */
export const sendPushToRole = async (
  role: string,
  payload: PushPayload
): Promise<void> => {
  if (!getMessaging()) return

  const users = await Auth.find({
    role,
    fcmTokens: { $exists: true, $ne: [] },
  }).select('_id fcmTokens')

  await Promise.all(
    users.map(u => sendToTokens(u.fcmTokens ?? [], payload, u._id.toString()))
  )
}

const sendToTokens = async (
  tokens: string[],
  payload: PushPayload,
  userId: string
): Promise<void> => {
  const messaging = getMessaging()
  if (!messaging || !tokens.length) return

  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
    })

    // Prune tokens Firebase reports as unregistered/invalid so the array
    // doesn't grow stale over time.
    const stale: string[] = []
    res.responses.forEach((r: any, i: number) => {
      if (r.success) return
      const code = r.error?.code ?? ''
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        stale.push(tokens[i])
      }
    })
    if (stale.length) {
      await Auth.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: stale } },
      })
    }
  } catch (err: any) {
    console.error('[push] send failed:', err.message)
  }
}
