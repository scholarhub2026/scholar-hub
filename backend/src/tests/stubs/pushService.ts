/** Test stub for `utils/pushService`. Push is a no-op in tests. */
export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export const sendPushToUser = async (_userId: string, _payload: PushPayload) => {}
export const sendPushToRole = async (_role: string, _payload: PushPayload) => {}
