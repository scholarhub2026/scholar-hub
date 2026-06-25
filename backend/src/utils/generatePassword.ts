import { encryptPassword } from '../helpers/Auth'

export const generatePass = async () => {
  const length = 10
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let password = ''

  for (let i = 0; i < length; i++) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length))
    password += randomChar
  }
  password = await encryptPassword(password)

  return password
}
