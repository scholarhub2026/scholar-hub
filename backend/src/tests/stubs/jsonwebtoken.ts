/**
 * Test stub for `jsonwebtoken`. The real package crashes on import under Node
 * 26 (its `jwa`/`buffer-equal-constant-time` dep uses the removed
 * `Buffer.SlowBuffer`). This stub implements deterministic sign/verify with
 * base64url-encoded JSON so the auth flow is exercised without native crypto.
 */
type Payload = Record<string, any>

const PREFIX = 'jwt.'

const sign = (payload: Payload, _secret: string, _opts?: any): string =>
  PREFIX + Buffer.from(JSON.stringify(payload)).toString('base64url')

const verify = (token: string, _secret: string): Payload => {
  if (typeof token !== 'string' || !token.startsWith(PREFIX)) {
    const err: any = new Error('invalid token')
    err.name = 'JsonWebTokenError'
    throw err
  }
  return JSON.parse(Buffer.from(token.slice(PREFIX.length), 'base64url').toString())
}

export { sign, verify }
export default { sign, verify }
