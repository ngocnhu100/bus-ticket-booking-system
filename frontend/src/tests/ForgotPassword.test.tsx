import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ForgotPassword from '../pages/ForgotPassword'

// Mock API
const mockRequestPasswordReset = vi.fn()
vi.mock('../api/auth', () => ({
  requestPasswordReset: (...args: string[]) =>
    mockRequestPasswordReset(...args),
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    )
  }

  describe('Rendering', () => {
    it('should render forgot password form', () => {
      renderComponent()

      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument()
    })

    it('should render back to login link', () => {
      renderComponent()

      expect(screen.getByText(/back to login/i)).toBeInTheDocument()
    })

    it('should render email input with correct type', () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderComponent()

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
      })

      expect(mockRequestPasswordReset).not.toHaveBeenCalled()
    })

    it('should show error for invalid email format', async () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument()
      })

      expect(mockRequestPasswordReset).not.toHaveBeenCalled()
    })

    it('should accept valid email format', async () => {
      mockRequestPasswordReset.mockResolvedValue({ success: true })
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: 'test@example.com',
        })
      })
    })
  })

  describe('Form Submission', () => {
    it('should show success message on successful submission', async () => {
      mockRequestPasswordReset.mockResolvedValue({ success: true })
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/if an account exists, a reset link has been sent/i)
        ).toBeInTheDocument()
      })
    })

    it('should show error message on API failure', async () => {
      mockRequestPasswordReset.mockRejectedValue(new Error('User not found'))
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, {
        target: { value: 'nonexistent@example.com' },
      })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button while submitting', async () => {
      mockRequestPasswordReset.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should call API with correct email', async () => {
      mockRequestPasswordReset.mockResolvedValue({ success: true })
      renderComponent()

      const testEmail = 'user@example.com'
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: testEmail } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: testEmail,
        })
      })
    })
  })

  describe('User Interaction', () => {
    it('should clear error when user starts typing', async () => {
      renderComponent()

      // Trigger error
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
      })

      // Start typing
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'a' } })

      // Error should be cleared
      expect(
        screen.queryByText(/enter a valid email address/i)
      ).not.toBeInTheDocument()
    })

    it('should update email value on input change', () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(emailInput.value).toBe('test@example.com')
    })
  })

  describe('Navigation', () => {
    it('should have working back to login link', () => {
      renderComponent()

      const backLink = screen.getByText(/back to login/i).closest('a')
      expect(backLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Edge Cases', () => {
    it('should handle network error gracefully', async () => {
      mockRequestPasswordReset.mockRejectedValue(new Error('Network error'))
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should handle empty error message', async () => {
      mockRequestPasswordReset.mockRejectedValue(new Error(''))
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Should show generic error message
        expect(
          screen.getByText(/unable to send reset link right now/i)
        ).toBeInTheDocument()
      })
    })

    it('should trim email before submission', async () => {
      mockRequestPasswordReset.mockResolvedValue({ success: true })
      renderComponent()

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, {
        target: { value: '  test@example.com  ' },
      })

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: expect.stringMatching(/^test@example\.com$/),
        })
      })
    })
  })
})
