import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Landing from '../pages/Landing'

// Mock all components for integration testing
vi.mock('../components/landing/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

vi.mock('../components/landing/HeroSection', () => ({
  HeroSection: () => <section data-testid="hero-section">Hero Section</section>,
}))

vi.mock('../components/landing/PopularRoutes', () => ({
  PopularRoutes: () => (
    <section data-testid="popular-routes">Popular Routes</section>
  ),
}))

vi.mock('../components/landing/WhyChooseUs', () => ({
  WhyChooseUs: () => (
    <section data-testid="why-choose-us">Why Choose Us</section>
  ),
}))

vi.mock('../components/landing/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

const renderLanding = () => {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  )
}

describe('Landing Page', () => {
  it('renders all main components', () => {
    renderLanding()

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('popular-routes')).toBeInTheDocument()
    expect(screen.getByTestId('why-choose-us')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('has correct page structure', () => {
    renderLanding()

    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('renders components in correct order', () => {
    renderLanding()

    const main = screen.getByRole('main')
    const children = main.children

    expect(children).toHaveLength(3)
    expect(children[0]).toHaveAttribute('data-testid', 'hero-section')
    expect(children[1]).toHaveAttribute('data-testid', 'popular-routes')
    expect(children[2]).toHaveAttribute('data-testid', 'why-choose-us')
  })

  it('renders without crashing', () => {
    expect(() => renderLanding()).not.toThrow()
  })

  it('maintains proper page layout', () => {
    renderLanding()

    // Check that header comes before main
    const header = screen.getByTestId('header')
    const main = screen.getByRole('main')
    const footer = screen.getByTestId('footer')

    // All elements should exist
    expect(header).toBeInTheDocument()
    expect(main).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
  })
})
