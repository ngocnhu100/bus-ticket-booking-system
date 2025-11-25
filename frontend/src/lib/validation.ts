export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const vietnamPhonePattern = /^\+84\d{8,9}$/
export const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

type LoginPayload = {
  identifier: string
  password: string
}

type RegisterPayload = {
  email: string
  phone: string
  password: string
  fullName: string
  role: string
}

const between = (value: string, min: number, max: number) => {
  const length = value.trim().length
  return length >= min && length <= max
}

const isValidEmail = (value: string) => emailPattern.test(value)

export function validateLogin(payload: LoginPayload) {
  const errors: Record<string, string> = {
    identifier: '',
    password: '',
  }

  if (!isValidEmail(payload.identifier)) {
    errors.identifier = 'Enter a valid email address.'
  }

  if (!payload.password.trim()) {
    errors.password = 'Password is required.'
  }

  return errors
}

export function validateRegister(payload: RegisterPayload) {
  const errors: Record<string, string> = {
    email: '',
    phone: '',
    password: '',
    fullName: '',
    role: '',
  }

  if (!emailPattern.test(payload.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!vietnamPhonePattern.test(payload.phone)) {
    errors.phone = 'Phone must follow the +84XXXXXXXXX format.'
  }

  if (!strongPasswordPattern.test(payload.password)) {
    errors.password = 'Password must include upper, lower, number, special char, min 8 chars.'
  }

  if (!between(payload.fullName, 2, 100)) {
    errors.fullName = 'Full name must be between 2 and 100 characters.'
  }

  if (payload.role !== 'passenger') {
    errors.role = 'Role must be passenger.'
  }

  return errors
}

export function hasErrors(errors: Record<string, string>) {
  return Object.values(errors).some((message) => Boolean(message))
}
