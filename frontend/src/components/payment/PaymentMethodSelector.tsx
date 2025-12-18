import React, { useState } from 'react'
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
      <h3 className="font-bold mb-2">Chọn phương thức thanh toán</h3>
      <div className="flex flex-wrap gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.key}
            className={`border rounded-lg p-4 flex flex-col items-center w-32 h-32 shadow-sm transition-all focus:outline-none ${selected === method.key ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'} ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => method.available && handleSelect(method)}
            disabled={!method.available}
            aria-pressed={selected === method.key}
          >
            <img src={method.logo} alt={method.name} className="h-10 mb-2" />
            <span className="font-medium">{method.name}</span>
            {method.available ? (
              <span className="text-xs text-green-600 mt-1">Có sẵn</span>
            ) : (
              <span className="text-xs text-red-500 mt-1">Không khả dụng</span>
            )}
            {selected === method.key && (
              <span className="mt-2 text-blue-600 font-semibold">Đã chọn</span>
            )}
          </button>
        ))}
      </div>
      {savedMethods.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-1">Phương thức đã lưu</h4>
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
                + Thêm phương thức mới
              </button>
            </li>
          </ul>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold text-lg">
          Số tiền:{' '}
          <span className="text-blue-700">
            {amount?.toLocaleString('vi-VN')}₫
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold border border-green-400 rounded px-2 py-1 ml-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
            <path
              d="M8 12l2 2 4-4"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Bảo mật
        </span>
      </div>
    </div>
  )
}
