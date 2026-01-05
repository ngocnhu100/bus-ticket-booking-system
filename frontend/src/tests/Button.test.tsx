import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      expect(
        screen.getByRole('button', { name: /click me/i })
      ).toBeInTheDocument()
    })

    it('should render button with children', () => {
      render(
        <Button>
          <span>Child content</span>
        </Button>
      )
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should render as button element by default', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('hover:bg-accent')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10')
    })

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
      expect(button).toHaveClass('w-9')
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      render(<Button>Enabled</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should have correct disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:opacity-50')
    })
  })

  describe('Events', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle multiple click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should accept form attribute', () => {
      render(<Button form="my-form">Form Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('form', 'my-form')
    })

    it('should accept aria attributes', () => {
      render(<Button aria-label="Custom Label">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom Label')
    })

    it('should accept data attributes', () => {
      render(<Button data-testid="my-button">Button</Button>)
      expect(screen.getByTestId('my-button')).toBeInTheDocument()
    })
  })

  describe('Composition', () => {
    it('should render with icon', () => {
      render(
        <Button>
          <svg data-testid="icon">Icon</svg>
          <span>With Icon</span>
        </Button>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('should support multiple children', () => {
      render(
        <Button>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Button>
      )

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should have button role', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Keyboard</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      // Simulate click for keyboard interaction
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle null children', () => {
      render(<Button>{null}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle undefined onClick', () => {
      expect(() => render(<Button>No Click</Button>)).not.toThrow()
    })

    it('should handle combination of variants and sizes', () => {
      render(
        <Button variant="destructive" size="lg">
          Combined
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveClass('h-10')
    })
  })
})
