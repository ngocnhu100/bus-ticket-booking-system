import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PaymentMethodSelector from './PaymentMethodSelector'

describe('PaymentMethodSelector', () => {
  it('renders all payment methods', () => {
    render(<PaymentMethodSelector amount={100000} />)
    expect(screen.getByText('MoMo')).toBeInTheDocument()
    expect(screen.getByText('ZaloPay')).toBeInTheDocument()
    expect(screen.getByText('PayOS')).toBeInTheDocument()
    expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument()
  })

  it('highlights selected method', () => {
    render(<PaymentMethodSelector amount={100000} />)
    const momoBtn = screen.getByText('MoMo').closest('button')
    fireEvent.click(momoBtn!)
    expect(momoBtn).toHaveClass('border-blue-500')
    expect(screen.getByText('Đã chọn')).toBeInTheDocument()
  })

  it('shows saved payment methods', () => {
    const saved = [
      { logo: '', name: 'Visa', displayName: 'Visa', last4: '1234' },
    ]
    render(<PaymentMethodSelector amount={100000} savedMethods={saved} />)
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText('•••• 1234')).toBeInTheDocument()
  })

  it('shows amount and security badge', () => {
    render(<PaymentMethodSelector amount={50000} />)
    expect(screen.getByText('Số tiền:')).toBeInTheDocument()
    expect(screen.getByText('Bảo mật')).toBeInTheDocument()
  })
})
