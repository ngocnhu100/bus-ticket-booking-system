import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import momoLogo from '../../assets/payment/momo.png'
import zaloLogo from '../../assets/payment/zalopay.png'
import payosLogo from '../../assets/payment/payos.png'
import cardLogo from '../../assets/payment/card.png'

const paymentMethods = [
  { key: 'momo', name: 'MoMo', logo: momoLogo, available: true },
  { key: 'zalopay', name: 'ZaloPay', logo: zaloLogo, available: true },
  { key: 'payos', name: 'PayOS', logo: payosLogo, available: true },
  { key: 'card', name: 'Credit/Debit Card', logo: cardLogo, available: true },
]

export default function PaymentMethodSelector({
  savedMethods = [],
  amount,
  onSelect,
}) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (method) => {
    setSelected(method.key)
    if (onSelect) onSelect(method)
  }

  return (
    <div className="payment-method-selector">
      <h3 className="font-bold mb-2">Pick a payment method</h3>
      <div className="flex flex-wrap gap-6">
        {paymentMethods.map((method) => (
          <button
            key={method.key}
            className={`border rounded-lg p-4 flex flex-col items-center w-40 h-32 shadow-sm transition-all focus:outline-none relative ${selected === method.key ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'} ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => method.available && handleSelect(method)}
            disabled={!method.available}
            aria-pressed={selected === method.key}
          >
            <img
              src={method.logo}
              alt={method.name}
              className="h-10 mb-2 object-contain max-w-full"
            />
            <span className="font-medium whitespace-nowrap">{method.name}</span>
            {method.available ? (
              <span className="text-xs text-green-600 mt-1">Available</span>
            ) : (
              <span className="text-xs text-red-500 mt-1">Unavailable</span>
            )}
            {selected === method.key && (
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-blue-600 font-semibold text-xs">
                Selected
              </span>
            )}
          </button>
        ))}
      </div>
      {savedMethods.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-1">Saved Payment Methods</h4>
          <ul className="space-y-2">
            {savedMethods.map((method, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <img src={method.logo} alt={method.name} className="h-6" />
                <span>{method.displayName}</span>
                <span className="ml-auto text-xs text-gray-500">
                  {method.last4 ? `•••• ${method.last4}` : ''}
                </span>
              </li>
            ))}
            <li>
              <button className="text-blue-600 hover:underline text-sm">
                + Add New Payment Method
              </button>
            </li>
          </ul>
        </div>
      )}
      <div className="mt-6 flex items-center justify-between">
        <span className="font-bold text-lg">
          Amount:{' '}
          <span className="text-blue-700">
            {amount?.toLocaleString('vi-VN')}₫
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold border border-green-700 rounded px-2 py-1 ml-2">
          <Lock size={16} className="text-green-700" />
          Secure Checkout
        </span>
      </div>
    </div>
  )
}
