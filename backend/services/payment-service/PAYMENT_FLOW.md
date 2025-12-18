# Frontend/Backend Payment Flow Integration

## 1. Payment Creation (Frontend → Backend)
- Frontend calls `POST /payments` on the payment-service with amount, currency, description, returnUrl, cancelUrl, and metadata.
- Backend creates a payment via PayOS and returns the payment URL or instructions to the frontend.

## 2. User Completes Payment (PayOS)
- User is redirected to PayOS to complete payment (credit card, digital wallet, etc).
- On completion, PayOS calls the backend webhook: `POST /payments/webhook`.

## 3. Webhook Handling (Backend)
- The webhook verifies the PayOS signature.
- Updates payment status in the database.
- If payment is completed:
  - Notifies booking-service (`/payments/confirm` endpoint) with paymentId and gatewayRef.
  - Notifies notification-service (`/notify/payment` endpoint) with paymentId and status.

## 4. Booking/Notification Services
- Booking-service confirms the booking and updates records.
- Notification-service sends email/SMS to the user.

## 5. Frontend Polling/Redirect
- Frontend can poll the backend for payment status or handle returnUrl/cancelUrl redirects for user feedback.

---

### Environment Variables Required
- `BOOKING_SERVICE_URL` (e.g., http://booking-service:3000)
- `NOTIFICATION_SERVICE_URL` (e.g., http://notification-service:3000)

---

**Note:** All sensitive operations and payment status updates are handled server-side for security and PCI-DSS compliance.
