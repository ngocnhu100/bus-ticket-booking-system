import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SearchForm from '../components/SearchForm'

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock LocationAutocomplete component (complex component with external deps)
vi.mock('@/components/ui/location-autocomplete', () => ({
  LocationAutocomplete: ({
    value,
    onValueChange,
    placeholder,
    type,
  }: {
    value: string
    onValueChange: (val: string) => void
    placeholder: string
    type: string
  }) => (
    <input
      data-testid={`location-${type}`}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}))

// Mock DatePicker component
vi.mock('react-datepicker', () => ({
  default: ({
    selected,
    onChange,
    placeholderText,
  }: {
    selected: Date | null
    onChange: (date: Date) => void
    placeholderText: string
  }) => (
    <input
      data-testid="date-picker"
      type="text"
      value={selected ? selected.toLocaleDateString('en-CA') : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null
        if (date) onChange(date)
      }}
      placeholder={placeholderText}
    />
  ),
}))

const renderSearchForm = () => {
  return render(
    <BrowserRouter>
      <SearchForm />
    </BrowserRouter>
  )
}

describe('SearchForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all form elements', () => {
      renderSearchForm()

      // Check labels
      expect(screen.getByText('Nơi xuất phát')).toBeInTheDocument()
      expect(screen.getByText('Nơi đến')).toBeInTheDocument()
      expect(screen.getByText('Ngày đi')).toBeInTheDocument()

      // Check inputs
      expect(screen.getByTestId('location-origin')).toBeInTheDocument()
      expect(screen.getByTestId('location-destination')).toBeInTheDocument()
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()

      // Check search button
      expect(
        screen.getByRole('button', { name: /tìm kiếm/i })
      ).toBeInTheDocument()
    })

    it('should render swap button', () => {
      renderSearchForm()
      const swapButtons = screen.getAllByRole('button')
      // Swap button should exist (button with ArrowLeftRight icon)
      expect(swapButtons.length).toBeGreaterThan(1)
    })

    it('should render with correct placeholders', () => {
      renderSearchForm()
      expect(screen.getByPlaceholderText(/nhập điểm đi/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/nhập điểm đến/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/chọn ngày/i)).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should update origin when typing', () => {
      renderSearchForm()
      const originInput = screen.getByTestId('location-origin')

      fireEvent.change(originInput, { target: { value: 'Ha Noi' } })
      expect(originInput).toHaveValue('Ha Noi')
    })

    it('should update destination when typing', () => {
      renderSearchForm()
      const destinationInput = screen.getByTestId('location-destination')

      fireEvent.change(destinationInput, { target: { value: 'Da Lat' } })
      expect(destinationInput).toHaveValue('Da Lat')
    })

    it('should update date when selected', () => {
      renderSearchForm()
      const datePicker = screen.getByTestId('date-picker')

      const testDate = '2025-12-20'
      fireEvent.change(datePicker, { target: { value: testDate } })
      expect(datePicker).toHaveValue(testDate)
    })

    it('should swap origin and destination values', () => {
      renderSearchForm()
      const originInput = screen.getByTestId('location-origin')
      const destinationInput = screen.getByTestId('location-destination')

      // Set initial values
      fireEvent.change(originInput, { target: { value: 'Ha Noi' } })
      fireEvent.change(destinationInput, { target: { value: 'Da Lat' } })

      expect(originInput).toHaveValue('Ha Noi')
      expect(destinationInput).toHaveValue('Da Lat')

      // Click swap button (second button, first is submit)
      const buttons = screen.getAllByRole('button')
      const swapButton = buttons.find(
        (btn) => btn.getAttribute('type') === 'button'
      )
      fireEvent.click(swapButton!)

      // Values should be swapped
      expect(originInput).toHaveValue('Da Lat')
      expect(destinationInput).toHaveValue('Ha Noi')
    })
  })

  describe('Form Submission', () => {
    it('should navigate with correct params when form is valid', () => {
      renderSearchForm()

      // Fill form
      fireEvent.change(screen.getByTestId('location-origin'), {
        target: { value: 'Ha Noi' },
      })
      fireEvent.change(screen.getByTestId('location-destination'), {
        target: { value: 'Da Lat' },
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2025-12-20' },
      })

      // Submit
      const searchButton = screen.getByRole('button', { name: /tìm kiếm/i })
      fireEvent.click(searchButton)

      // Check navigation was called with trip search results path
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trip-search-results?')
      )
      // Check params are present (URL encoding may vary)
      const callArg = mockNavigate.mock.calls[0][0] as string
      expect(callArg).toMatch(/origin=.*Noi/)
      expect(callArg).toMatch(/destination=.*Lat/)
      expect(callArg).toMatch(/date=2025-12-20/)
    })

    it('should not navigate when origin is missing', () => {
      renderSearchForm()

      // Fill only destination and date
      fireEvent.change(screen.getByTestId('location-destination'), {
        target: { value: 'Da Lat' },
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2025-12-20' },
      })

      // Submit
      const searchButton = screen.getByRole('button', { name: /tìm kiếm/i })
      fireEvent.click(searchButton)

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not navigate when destination is missing', () => {
      renderSearchForm()

      // Fill only origin and date
      fireEvent.change(screen.getByTestId('location-origin'), {
        target: { value: 'Ha Noi' },
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2025-12-20' },
      })

      // Submit
      const searchButton = screen.getByRole('button', { name: /tìm kiếm/i })
      fireEvent.click(searchButton)

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not navigate when date is missing', () => {
      renderSearchForm()

      // Fill only origin and destination
      fireEvent.change(screen.getByTestId('location-origin'), {
        target: { value: 'Ha Noi' },
      })
      fireEvent.change(screen.getByTestId('location-destination'), {
        target: { value: 'Da Lat' },
      })

      // Submit
      const searchButton = screen.getByRole('button', { name: /tìm kiếm/i })
      fireEvent.click(searchButton)

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should include passengers parameter in search', () => {
      renderSearchForm()

      // Fill form
      fireEvent.change(screen.getByTestId('location-origin'), {
        target: { value: 'Ha Noi' },
      })
      fireEvent.change(screen.getByTestId('location-destination'), {
        target: { value: 'Da Lat' },
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2025-12-20' },
      })

      // Submit
      const searchButton = screen.getByRole('button', { name: /tìm kiếm/i })
      fireEvent.click(searchButton)

      // Check passengers param
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('passengers=1')
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple swaps correctly', () => {
      renderSearchForm()
      const originInput = screen.getByTestId('location-origin')
      const destinationInput = screen.getByTestId('location-destination')

      // Set values
      fireEvent.change(originInput, { target: { value: 'A' } })
      fireEvent.change(destinationInput, { target: { value: 'B' } })

      const buttons = screen.getAllByRole('button')
      const swapButton = buttons.find(
        (btn) => btn.getAttribute('type') === 'button'
      )

      // Swap 1
      fireEvent.click(swapButton!)
      expect(originInput).toHaveValue('B')
      expect(destinationInput).toHaveValue('A')

      // Swap 2
      fireEvent.click(swapButton!)
      expect(originInput).toHaveValue('A')
      expect(destinationInput).toHaveValue('B')
    })

    it('should handle empty swap correctly', () => {
      renderSearchForm()
      const buttons = screen.getAllByRole('button')
      const swapButton = buttons.find(
        (btn) => btn.getAttribute('type') === 'button'
      )

      // Should not throw when swapping empty values
      expect(() => fireEvent.click(swapButton!)).not.toThrow()
    })

    it('should prevent form submission on Enter when invalid', () => {
      renderSearchForm()

      // Submit without filling form
      const form = screen
        .getByRole('button', { name: /tìm kiếm/i })
        .closest('form')
      fireEvent.submit(form!)

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
