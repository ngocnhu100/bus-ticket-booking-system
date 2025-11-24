export const emailPattern = new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')

export function validateCredentials({
  email,
  password,
}: {
  email: string
  password: string
}) {
  return {
    email: emailPattern.test(email) ? '' : 'Enter a valid email address.',
    password:
      password.trim().length >= 8 ? '' : 'Password must be at least 8 characters.',
  }
}

export function hasErrors(errors: Record<string, string>) {
  return Object.values(errors).some((message) => Boolean(message))
}
