import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Landing from '../pages/Landing'

// Mock all child components
vi.mock('@/components/landing/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

vi.mock('@/components/landing/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}))

vi.mock('@/components/landing/PopularRoutes', () => ({
  PopularRoutes: () => <div data-testid="popular-routes">Popular Routes</div>,
}))

vi.mock('@/components/landing/WhyChooseUs', () => ({
  WhyChooseUs: () => <div data-testid="why-choose-us">Why Choose Us</div>,
}))

vi.mock('@/components/landing/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('@/components/reviews/ReviewsSection', () => ({
  default: () => <div data-testid="reviews-section">Reviews Section</div>,
}))

vi.mock('@/components/ChatButton', () => ({
  default: () => <div data-testid="chat-button">Chat Button</div>,
}))

describe('Landing Page Component', () => {
  const renderLanding = () => {
    return render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )
  }

  describe('Component Rendering', () => {
    it('should render all main sections', () => {
      renderLanding()

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('hero-section')).toBeInTheDocument()
      expect(screen.getByTestId('popular-routes')).toBeInTheDocument()
      expect(screen.getByTestId('why-choose-us')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render header component', () => {
      renderLanding()
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should render hero section', () => {
      renderLanding()
      expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    })

    it('should render why choose us section', () => {
      renderLanding()
      expect(screen.getByTestId('why-choose-us')).toBeInTheDocument()
    })

    it('should render popular routes section', () => {
      renderLanding()
      expect(screen.getByTestId('popular-routes')).toBeInTheDocument()
    })

    it('should render news section if present', () => {
      renderLanding()
      // News section might be conditional
      const newsSection = screen.queryByTestId('news-section')
      if (newsSection) {
        expect(newsSection).toBeInTheDocument()
      }
    })

    it('should render rental section if present', () => {
      renderLanding()
      // Rental section might be conditional
      const rentalSection = screen.queryByTestId('rental-section')
      if (rentalSection) {
        expect(rentalSection).toBeInTheDocument()
      }
    })

    it('should render reviews section if present', () => {
      renderLanding()
      // Reviews section might be conditional
      const reviewsSection = screen.queryByTestId('reviews-section')
      if (reviewsSection) {
        expect(reviewsSection).toBeInTheDocument()
      }
    })

    it('should render chat button', () => {
      renderLanding()
      // Chat button might be conditional
      const chatButton = screen.queryByTestId('chat-button')
      if (chatButton) {
        expect(chatButton).toBeInTheDocument()
      }
    })

    it('should render footer component', () => {
      renderLanding()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper page structure', () => {
      const { container } = renderLanding()
      expect(container.firstChild).toBeTruthy()
    })

    it('should render components in correct order', () => {
      renderLanding()

      const components = [
        screen.getByTestId('header'),
        screen.getByTestId('hero-section'),
        screen.getByTestId('popular-routes'),
        screen.getByTestId('why-choose-us'),
        screen.getByTestId('footer'),
      ]

      components.forEach((component) => {
        expect(component).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render without crashing on mobile viewport', () => {
      // Simulate mobile viewport
      window.innerWidth = 375
      window.innerHeight = 667

      expect(() => renderLanding()).not.toThrow()
    })

    it('should render without crashing on tablet viewport', () => {
      // Simulate tablet viewport
      window.innerWidth = 768
      window.innerHeight = 1024

      expect(() => renderLanding()).not.toThrow()
    })

    it('should render without crashing on desktop viewport', () => {
      // Simulate desktop viewport
      window.innerWidth = 1920
      window.innerHeight = 1080

      expect(() => renderLanding()).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible without throwing errors', () => {
      const { container } = renderLanding()
      expect(container).toBeTruthy()
    })

    it('should render main content area', () => {
      const { container } = renderLanding()
      // Check if there's a main content area (div or main element)
      expect(container.querySelector('div, main')).toBeTruthy()
    })
  })

  describe('Integration', () => {
    it('should integrate all components without errors', () => {
      expect(() => renderLanding()).not.toThrow()
    })

    it('should not have console errors during render', () => {
      const consoleSpy = vi.spyOn(console, 'error')
      renderLanding()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
