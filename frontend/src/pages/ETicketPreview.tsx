import React, { useRef, useState } from 'react'
import { ETicket } from '@/components/booking/ETicket'
import type { ETicketData } from '@/components/booking/ETicket'

// Mock data for demonstration
const mockConfirmedBooking: ETicketData = {
  bookingReference: 'BK2024010001',
  status: 'confirmed',
  paymentStatus: 'paid',
  bookingDate: '2024-01-15T10:30:00Z',
  passengers: [
    {
      name: 'Nguyen Van A',
      seatNumber: 'A12',
      passengerType: 'adult',
    },
    {
      name: 'Tran Thi B',
      seatNumber: 'A13',
      passengerType: 'adult',
    },
  ],
  trip: {
    route: {
      originCity: 'Ho Chi Minh',
      destinationCity: 'Da Lat',
      distance: 308,
    },
    operator: {
      name: 'BusGo Express',
    },
    schedule: {
      departureTime: '2024-01-20T08:00:00+07:00',
      arrivalTime: '2024-01-20T14:30:00+07:00',
      duration: 390,
    },
    bus: {
      busNumber: 'BUS-001',
      type: 'VIP Sleeper',
    },
  },
  pricing: {
    subtotal: 540000,
    serviceFee: 10000,
    total: 550000,
  },
  contact: {
    email: 'nguyenvana@example.com',
    phone: '0901234567',
  },
  qrCode:
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BK2024010001',
}

const ETicketPreview: React.FC = () => {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const element = ticketRef.current
      if (!element) {
        throw new Error('Ticket not found for download')
      }

      // Get the actual ticket card content only
      const ticketCard =
        element.querySelector('.e-ticket-container > div') || element

      // Create a new window with just the ticket
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        throw new Error('Cannot open print window. Please allow popups.')
      }

      // Write content to new window with inline CSS
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>E-Ticket - ${mockConfirmedBooking.bookingReference}</title>
            <meta charset="utf-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                margin: 0;
                padding: 20px;
                background: white;
                font-family: Inter, system-ui, -apple-system, sans-serif;
              }
              
              /* Tailwind utilities */
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .gap-1 { gap: 0.25rem; }
              .gap-2 { gap: 0.5rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .space-y-4 > * + * { margin-top: 1rem; }
              .space-y-6 > * + * { margin-top: 1.5rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .rounded-full { border-radius: 9999px; }
              .rounded-xl { border-radius: 0.75rem; }
              .p-2 { padding: 0.5rem; }
              .p-3 { padding: 0.75rem; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .pt-4 { padding-top: 1rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .font-bold { font-weight: 700; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .uppercase { text-transform: uppercase; }
              .tracking-wider { letter-spacing: 0.05em; }
              .border { border-width: 1px; }
              .border-2 { border-width: 2px; }
              .border-t { border-top-width: 1px; }
              .border-b-2 { border-bottom-width: 2px; }
              .border-dashed { border-style: dashed; }
              .border-black { border-color: rgb(0, 0, 0); }
              .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
              .h-4 { height: 1rem; }
              .w-4 { width: 1rem; }
              .h-5 { height: 1.25rem; }
              .w-5 { width: 1.25rem; }
              .h-6 { height: 1.5rem; }
              .w-6 { width: 1.5rem; }
              .h-10 { height: 2.5rem; }
              .w-10 { width: 2.5rem; }
              .h-12 { height: 3rem; }
              .w-12 { width: 3rem; }
              .h-48 { height: 12rem; }
              .w-48 { width: 12rem; }
              .flex-1 { flex: 1 1 0%; }
              .flex-col { flex-direction: column; }
              .max-w-4xl { max-width: 56rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .mt-1 { margin-top: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .object-contain { object-fit: contain; }
              .h-full { height: 100%; }
              .w-full { width: 100%; }
              
              /* Colors */
              .bg-black { background-color: rgb(0, 0, 0); }
              .text-white { color: rgb(255, 255, 255); }
              .text-primary { color: rgb(99, 102, 241); }
              .text-muted-foreground { color: rgb(113, 113,122); }
              .bg-card { background-color: rgb(255, 255, 255); }
              .text-card-foreground { color: rgb(24, 24, 27); }
              
              /* Badge */
              .inline-flex { display: inline-flex; }
              .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
              .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
              .whitespace-nowrap { white-space: nowrap; }
              
              /* Badge variants */
              .badge-default {
                background-color: rgb(99, 102, 241);
                color: white;
              }
              
              .badge-secondary {
                background-color: rgb(244, 244, 245);
                color: rgb(24, 24, 27);
              }
              
              .badge-outline {
                background-color: transparent;
                border: 1px solid rgb(0, 0, 0);
              }
              
              /* Separator */
              .h-px { height: 1px; }
              .bg-border { background-color: rgb(229, 231, 235); }
              
              /* Ensure header background is preserved */
              .bg-black {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 5mm;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                }
                
                .print\\:hidden {
                  display: none !important;
                }
                
                .shadow {
                  box-shadow: none !important;
                }
                
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                
                /* Scale to fit one page */
                .p-6 {
                  padding: 1rem !important;
                }
                
                .space-y-6 > * + * {
                  margin-top: 1rem !important;
                }
                
                .space-y-4 > * + * {
                  margin-top: 0.75rem !important;
                }
                
                /* QR section page break */
                .page-break-avoid {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                
                /* Smaller QR for print */
                .h-48.w-48 {
                  height: 8rem !important;
                  width: 8rem !important;
                }
              }
            </style>
          </head>
          <body>
            ${ticketCard.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Close after print dialog
          setTimeout(() => {
            printWindow.close()
            setIsDownloading(false)
          }, 1000)
        }, 500)
      }

      // Fallback if onload doesn't fire
      setTimeout(() => {
        setIsDownloading(false)
      }, 3000)
    } catch (error) {
      console.error('Download error:', error)
      alert(
        `Error: ${error instanceof Error ? error.message : 'Cannot download ticket'}. Please try again.`
      )
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <style>
        {`
          .e-ticket-wrapper {
            --background: 255 255 255;
            --foreground: 24 24 27;
            --card: 255 255 255;
            --card-foreground: 24 24 27;
            --primary: 99 102 241;
            --primary-foreground: 255 255 255;
            --muted: 244 244 245;
            --muted-foreground: 113 113 122;
            --border: 229 231 235;
          }
        `}
      </style>
      <div className="container mx-auto py-8 e-ticket-wrapper">
        <div className="max-w-4xl mx-auto">
          <ETicket
            ref={ticketRef}
            data={mockConfirmedBooking}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        </div>
      </div>
    </div>
  )
}

export default ETicketPreview
