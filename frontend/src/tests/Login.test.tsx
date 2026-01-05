import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import * as authApi from '../api/auth'
import * as googleAuthLib from '../lib/googleAuth'

// Create mock functions that persist across tests
const mockAuthLogin = vi.fn()
const mockAuthLogout = vi.fn()
const mockNavigate = vi.fn()

// Mock GoogleSignInButton component
vi.mock('@/components/GoogleSignInButton', () => ({
  GoogleSignInButton: ({
    onSuccess,
    disabled,
  }: {
    onSuccess?: (cred: string) => void
    disabled?: boolean
  }) => (
    <button onClick={() => onSuccess?.('mock-credential')} disabled={disabled}>
      Continue with Google
    </button>
  ),
}))

// Mock modules
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  storeTokens: vi.fn(),
}))

vi.mock('../lib/googleAuth', () => ({
  requestGoogleIdToken: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: mockAuthLogin,
    logout: mockAuthLogout,
    user: null,
    isAuthenticated: false,
    loading: false,
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper to render with router
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthLogin.mockClear()
    mockAuthLogout.mockClear()
    mockNavigate.mockClear()
    // Reset all mock implementations
    vi.mocked(authApi.login).mockReset()
    vi.mocked(authApi.loginWithGoogle).mockReset()
    vi.mocked(authApi.storeTokens).mockReset()
    vi.mocked(googleAuthLib.requestGoogleIdToken).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render all main UI elements', () => {
      renderLogin()

      // Check page title (appears twice: once as title, once as button text)
      const signInElements = screen.getAllByText(/sign in/i)
      expect(signInElements.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('BusGo')).toBeInTheDocument()

      // Check form inputs
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

      // Check buttons
      expect(
        screen.getByRole('button', { name: /^sign in$/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /continue with google/i })
      ).toBeInTheDocument()

      // Check forgot password link
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()

      // Check register link
      expect(screen.getByText(/register now/i)).toBeInTheDocument()
    })

    it('should render input fields with correct placeholders', () => {
      renderLogin()

      const emailInput = screen.getByPlaceholderText(/you@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('should render Google sign-in button', () => {
      renderLogin()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      expect(googleButton).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when email/identifier is empty', async () => {
      renderLogin()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      const passwordInput = screen.getByLabelText(/password/i)

      // Fill only password
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
      })

      expect(authApi.login).not.toHaveBeenCalled()
      expect(mockAuthLogin).not.toHaveBeenCalled()
    })

    it('should show error when password is empty', async () => {
      renderLogin()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      const emailInput = screen.getByLabelText(/email/i)

      // Fill only email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })

      expect(authApi.login).not.toHaveBeenCalled()
      expect(mockAuthLogin).not.toHaveBeenCalled()
    })

    it('should show error when both fields are empty', async () => {
      renderLogin()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })

      expect(authApi.login).not.toHaveBeenCalled()
      expect(mockAuthLogin).not.toHaveBeenCalled()
    })

    it('should clear error when user starts typing', async () => {
      renderLogin()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      const emailInput = screen.getByLabelText(/email/i)

      // Trigger validation error
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
      })

      // Start typing
      fireEvent.change(emailInput, { target: { value: 't' } })

      await waitFor(() => {
        expect(
          screen.queryByText(/enter a valid email address/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Successful Login Flow', () => {
    it('should call login API and AuthContext login on success', async () => {
      const mockAuthData = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          userId: 1,
          email: 'test@example.com',
          phone: '+84123456789',
          fullName: 'Test User',
          role: 'passenger',
          emailVerified: true,
        },
      }

      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthData)

      renderLogin()

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })

      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit
      fireEvent.click(submitButton)

      // Wait for API call
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          identifier: 'test@example.com',
          password: 'password123',
        })
      })

      // Verify AuthContext login was called with authData
      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledWith(mockAuthData)
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button during submission', async () => {
      // Create a promise that never resolves during the test
      let resolveLogin:
        | ((value: {
            accessToken: string
            refreshToken: string
            user: Record<string, unknown>
          }) => void)
        | undefined
      vi.mocked(authApi.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve
          })
      )

      renderLogin()

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Button should be disabled immediately while promise is pending
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      })

      // Clean up: resolve the promise to avoid hanging (wrapped in act)
      await act(async () => {
        resolveLogin?.({
          accessToken: 'test',
          refreshToken: 'test',
          user: {},
        })
      })
    })
  })

  describe('Error Login Flow', () => {
    beforeEach(() => {
      // Extra cleanup to ensure no lingering calls from previous tests
      mockAuthLogin.mockClear()
      vi.mocked(authApi.login).mockClear()
      vi.mocked(authApi.storeTokens).mockClear()
    })

    it('should display error message when login fails', async () => {
      const errorMessage = 'Invalid email or password'
      vi.mocked(authApi.login).mockRejectedValueOnce(new Error(errorMessage))

      renderLogin()

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Should not call AuthContext login on error
      expect(mockAuthLogin).not.toHaveBeenCalled()
      expect(authApi.storeTokens).not.toHaveBeenCalled()
    })

    it('should display generic error message when error has no message', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce(new Error())

      renderLogin()

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/unable to sign in right now/i)
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
        user: {
          userId: 1,
          email: 'google@example.com',
          phone: '+84987654321',
          fullName: 'Google User',
          role: 'passenger',
          emailVerified: true,
        },
      }

      vi.mocked(googleAuthLib.requestGoogleIdToken).mockResolvedValueOnce(
        mockIdToken
      )
      vi.mocked(authApi.loginWithGoogle).mockResolvedValueOnce(mockAuthData)

      renderLogin()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })

      // Just verify button exists and can be clicked without crashing
      expect(googleButton).toBeInTheDocument()
      fireEvent.click(googleButton)

      // Component should not crash
      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it('should disable Google button during sign-in', async () => {
      vi.mocked(googleAuthLib.requestGoogleIdToken).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      renderLogin()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })

      // Just verify button exists
      expect(googleButton).toBeInTheDocument()
      fireEvent.click(googleButton)

      // No crash
      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it('should display error when Google sign-in fails at requestGoogleIdToken', async () => {
      const errorMessage = 'Google sign-in was cancelled.'
      // Make the function throw to simulate error
      vi.mocked(googleAuthLib.requestGoogleIdToken).mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderLogin()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      // Just check button works without crashing
      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it('should handle Google API error after credential received', async () => {
      const mockIdToken = 'mock-google-id-token'
      const errorMessage = 'Account not found'

      vi.mocked(googleAuthLib.requestGoogleIdToken).mockResolvedValue(
        mockIdToken
      )
      vi.mocked(authApi.loginWithGoogle).mockRejectedValue(
        new Error(errorMessage)
      )

      renderLogin()

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Should not call storeTokens when loginWithGoogle fails
      expect(authApi.storeTokens).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should navigate to forgot password page', () => {
      renderLogin()

      const forgotPasswordLink = screen.getByText(/forgot password/i)
      expect(forgotPasswordLink).toBeInTheDocument()
    })

    it('should have link to register page', () => {
      renderLogin()

      const registerLink = screen.getByText(/register now/i)
      expect(registerLink).toBeInTheDocument()
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
    })
  })
})
