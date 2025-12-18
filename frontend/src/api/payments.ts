import { request } from './auth'

export interface PaymentRequest {
  bookingId: string
  paymentMethod: string
  amount: number
  returnUrl: string
  metadata?: Record<string, unknown>
}

export interface PaymentResponse {
  success: boolean
  data: {
    paymentId: string
    status: string
    paymentUrl: string
    qrCode?: string
    expiresAt?: string
  }
  message?: string
}

export async function createPayment(
  paymentData: PaymentRequest
): Promise<PaymentResponse> {
  try {
    const response = await request('/payments', {
      method: 'POST',
      body: paymentData,
    })
    return response
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}
