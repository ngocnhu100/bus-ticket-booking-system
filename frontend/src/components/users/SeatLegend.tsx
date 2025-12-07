import React from 'react'
import { Check, AlertCircle, Square } from 'lucide-react'
import { Card } from '@/components/ui/card'
import './SeatLegend.css'

/**
 * SeatLegend Component
 *
 * Displays a legend explaining seat types and availability.
 * Helps users understand the seat map before making selections.
 */
export function SeatLegend() {
  const legendItems = [
    {
      id: 'available',
      label: 'Available',
      className: 'seat-available',
      icon: <Square className="w-4 h-4" />,
    },
    {
      id: 'selected',
      label: 'Selected',
      className: 'seat-selected',
      icon: <Check className="w-4 h-4" />,
    },
    {
      id: 'occupied',
      label: 'Occupied',
      className: 'seat-occupied',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: 'locked',
      label: 'Locked',
      className: 'seat-locked',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ]

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4">Legend</h3>

      <div className="flex flex-wrap gap-6">
        {legendItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {/* Mini Seat */}
            <div
              className={`
                seat-legend-item
                ${item.className}
              `}
            >
              {item.icon}
            </div>

            {/* Label */}
            <span className="text-sm text-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Seat Types Info */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
          Seat Types
        </h4>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="font-medium text-foreground min-w-fit">
              Standard:
            </span>
            <span>Regular seat for economy travel</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-medium text-foreground min-w-fit">VIP:</span>
            <span>Premium seat with extra comfort and amenities</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
