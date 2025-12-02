import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Register from '../pages/Register'
import * as authApi from '../api/auth'
import * as googleAuthLib from '../lib/googleAuth'

// Mock modules
vi.mock('../api/auth', () => ({
  registerAccount: vi.fn(),
  loginWithGoogle: vi.fn(),
  storeTokens: vi.fn(),
}))

vi.mock('../lib/googleAuth', () => ({
  requestGoogleIdToken: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper to render with router
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  )
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render all main UI elements', () => {
      renderRegister()

      // Check page title
      expect(screen.getByText(/register/i)).toBeInTheDocument()
      expect(screen.getByText('Bus Ticket Booking System')).toBeInTheDocument()

      // Check form inputs
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

      // Check buttons
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /continue with google/i })
      ).toBeInTheDocument()

      // Check login link
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })

    it('should render input fields with correct placeholders', () => {
      renderRegister()

      expect(screen.getByPlaceholderText(/nguyen van a/i)).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(/you@example.com/i)
      ).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/\+84/i)).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(/create a strong password/i)
      ).toBeInTheDocument()
    })

    it('should render Google sign-in button', () => {
      renderRegister()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      expect(googleButton).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when full name is empty', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)

      // Fill all fields except full name
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/full name must be between/i)
        ).toBeInTheDocument()
      })

      expect(authApi.registerAccount).not.toHaveBeenCalled()
    })

    it('should show error when email is invalid', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
      })

      expect(authApi.registerAccount).not.toHaveBeenCalled()
    })

    it('should show error when phone is invalid', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '0912345678' } }) // Invalid format
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/phone must follow/i)).toBeInTheDocument()
      })

      expect(authApi.registerAccount).not.toHaveBeenCalled()
    })

    it('should show error when password is weak', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'weak' } })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must include/i)).toBeInTheDocument()
      })

      expect(authApi.registerAccount).not.toHaveBeenCalled()
    })

    it('should show multiple errors when multiple fields are invalid', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/full name must be between/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
        expect(screen.getByText(/phone must follow/i)).toBeInTheDocument()
        expect(screen.getByText(/password must include/i)).toBeInTheDocument()
      })

      expect(authApi.registerAccount).not.toHaveBeenCalled()
    })

    it('should clear error when user starts typing', async () => {
      renderRegister()

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      const fullNameInput = screen.getByLabelText(/full name/i)

      // Trigger validation error
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/full name must be between/i)
        ).toBeInTheDocument()
      })

      // Start typing
      fireEvent.change(fullNameInput, { target: { value: 'J' } })

      await waitFor(() => {
        expect(
          screen.queryByText(/full name must be between/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Successful Registration Flow', () => {
    it('should call registerAccount API and navigate to login on success', async () => {
      const mockAuthData = {
        user: { id: 1, email: 'test@example.com', fullName: 'John Doe' },
        message: 'Please check your email to verify your account.',
      }

      vi.mocked(authApi.registerAccount).mockResolvedValue(mockAuthData)

      renderRegister()

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })

      // Fill form
      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

      // Submit
      fireEvent.click(submitButton)

      // Wait for API call
      await waitFor(() => {
        expect(authApi.registerAccount).toHaveBeenCalledWith({
          fullName: 'John Doe',
          email: 'test@example.com',
          phone: '+84901234567',
          password: 'Password123!',
          role: 'passenger',
        })
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/account created/i)).toBeInTheDocument()
      })

      // Verify navigation after timeout
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
        },
        { timeout: 900 }
      )
    })

    it('should disable submit button during submission', async () => {
      vi.mocked(authApi.registerAccount).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ user: {} }), 100))
      )

      renderRegister()

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      fireEvent.click(submitButton)

      // Button should be disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/submitting/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Registration Flow', () => {
    it('should display error message when registration fails', async () => {
      const errorMessage = 'Email already exists'
      vi.mocked(authApi.registerAccount).mockRejectedValue(
        new Error(errorMessage)
      )

      renderRegister()

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, {
        target: { value: 'existing@example.com' },
      })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should display generic error message when error has no message', async () => {
      vi.mocked(authApi.registerAccount).mockRejectedValue(new Error())

      renderRegister()

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '+84901234567' } })
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/unable to create your account/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Google Sign-In Integration', () => {
    it('should call requestGoogleIdToken and handle credential', async () => {
      const mockIdToken = 'mock-google-id-token'
      const mockAuthData = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 1, email: 'google@example.com' },
      }

      vi.mocked(googleAuthLib.requestGoogleIdToken).mockResolvedValue(
        mockIdToken
      )
      vi.mocked(authApi.loginWithGoogle).mockResolvedValue(mockAuthData)

      renderRegister()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      // Wait for requestGoogleIdToken
      await waitFor(() => {
        expect(googleAuthLib.requestGoogleIdToken).toHaveBeenCalled()
      })

      // Verify loginWithGoogle was called with the ID token
      await waitFor(() => {
        expect(authApi.loginWithGoogle).toHaveBeenCalledWith({
          idToken: mockIdToken,
        })
      })

      // Verify storeTokens was called
      expect(authApi.storeTokens).toHaveBeenCalledWith(mockAuthData)

      // Verify success message
      await waitFor(() => {
        expect(
          screen.getByText(/google sign-in successful/i)
        ).toBeInTheDocument()
      })

      // Verify navigation
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
            replace: true,
          })
        },
        { timeout: 700 }
      )
    })

    it('should disable Google button during sign-in', async () => {
      vi.mocked(googleAuthLib.requestGoogleIdToken).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      renderRegister()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      // Button should be disabled
      await waitFor(() => {
        expect(googleButton).toBeDisabled()
        expect(screen.getByText(/contacting google/i)).toBeInTheDocument()
      })
    })

    it('should display error when Google sign-in fails', async () => {
      const errorMessage = 'Google sign-in was cancelled.'
      vi.mocked(googleAuthLib.requestGoogleIdToken).mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderRegister()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // When requestGoogleIdToken throws, catch block is executed and error is shown
      // loginWithGoogle is not called because error is caught before reaching it
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle Google API error after credential received', async () => {
      const mockIdToken = 'mock-google-id-token'
      const errorMessage = 'Failed to create account'

      vi.mocked(googleAuthLib.requestGoogleIdToken).mockResolvedValue(
        mockIdToken
      )
      vi.mocked(authApi.loginWithGoogle).mockRejectedValue(
        new Error(errorMessage)
      )

      renderRegister()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      expect(authApi.storeTokens).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should have link to login page', () => {
      renderRegister()

      const loginLink = screen.getByText(/sign in/i)
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })
  })
})
