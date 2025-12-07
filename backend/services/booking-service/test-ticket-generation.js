/**
 * Test script for ticket generation and email functionality
 * Run: node test-ticket-generation.js
 */

const bookingService = require('./src/bookingService');
const ticketService = require('./src/services/ticketService');

// Test data - booking ID từ database
const TEST_BOOKING_ID = 'test-booking-id'; // Replace with actual booking ID

async function testTicketGeneration() {
  console.log('🧪 Testing Ticket Generation System\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Confirm booking (triggers ticket generation)
    console.log('\n📋 Test 1: Confirm Booking & Generate Ticket');
    console.log('-'.repeat(60));
    
    // Note: You need to create a booking first or use existing booking ID
    console.log('⚠️  To test, you need to:');
    console.log('1. Create a booking via POST /bookings');
    console.log('2. Get the booking_id from response');
    console.log('3. Update TEST_BOOKING_ID in this script');
    console.log('4. Run: POST /bookings/:bookingId/confirm\n');

    // Test 2: Manual ticket generation
    console.log('📋 Test 2: Manual Ticket Generation');
    console.log('-'.repeat(60));
    
    const mockBooking = {
      booking_id: '123e4567-e89b-12d3-a456-426614174000',
      booking_reference: 'BK20251207001',
      trip_id: 'TRIP_TEST_001',
      contact_email: 'test@example.com',
      contact_phone: '0901234567',
      status: 'confirmed',
      total_price: 250000,
      subtotal: 237500,
      service_fee: 12500,
      currency: 'VND',
      passengers: [
        {
          full_name: 'Nguyen Van A',
          seat_code: 'A1',
          document_id: '001234567890'
        }
      ],
      created_at: new Date()
    };

    console.log('Mock booking data:');
    console.log(JSON.stringify(mockBooking, null, 2));
    
    console.log('\n🎫 Generating ticket...');
    const ticket = await ticketService.generateTicket(mockBooking);
    
    console.log('✅ Ticket generated successfully!');
    console.log('📄 Ticket URL:', ticket.ticketUrl);
    console.log('🔳 QR Code length:', ticket.qrCode.length, 'characters');
    
    // Test 3: Test email template
    console.log('\n📋 Test 3: Email Template Generation');
    console.log('-'.repeat(60));
    
    const { generateTicketEmailTemplate } = require('../notification-service/src/templates/ticketEmailTemplate');
    
    const emailHtml = generateTicketEmailTemplate({
      bookingReference: mockBooking.booking_reference,
      tripId: mockBooking.trip_id,
      status: mockBooking.status,
      totalPrice: mockBooking.total_price,
      currency: mockBooking.currency,
      passengers: mockBooking.passengers,
      contactEmail: mockBooking.contact_email,
      contactPhone: mockBooking.contact_phone,
      ticketUrl: ticket.ticketUrl,
      qrCode: ticket.qrCode
    });
    
    console.log('✅ Email HTML generated!');
    console.log('📧 HTML length:', emailHtml.length, 'characters');
    
    // Save email HTML for preview
    const fs = require('fs');
    const emailPreviewPath = './test-email-preview.html';
    fs.writeFileSync(emailPreviewPath, emailHtml);
    console.log('💾 Email preview saved to:', emailPreviewPath);
    console.log('   Open this file in browser to preview');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!\n');
    
    console.log('📝 Next Steps:');
    console.log('1. Check generated PDF in ./tickets/ directory');
    console.log('2. Open test-email-preview.html to see email template');
    console.log('3. Test full flow with real booking:');
    console.log('   POST http://localhost:3000/bookings');
    console.log('   POST http://localhost:3000/bookings/:bookingId/confirm\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// API endpoint test examples
function printAPIExamples() {
  console.log('\n📚 API Endpoint Examples:');
  console.log('='.repeat(60));
  
  console.log('\n1. Create Booking (Guest):');
  console.log('POST http://localhost:3000/bookings');
  console.log('Body:');
  console.log(JSON.stringify({
    tripId: 'TRIP_TEST_001',
    isGuestCheckout: true,
    contactEmail: 'guest@example.com',
    contactPhone: '0901234567',
    passengers: [{
      fullName: 'Test User',
      seatNumber: 'A1'
    }],
    totalPrice: 150000
  }, null, 2));
  
  console.log('\n2. Confirm Booking (Trigger Ticket Generation):');
  console.log('POST http://localhost:3000/bookings/:bookingId/confirm');
  console.log('Headers: Authorization: Bearer <JWT> (optional)');
  
  console.log('\n3. Get Booking with eTicket:');
  console.log('GET http://localhost:3000/bookings/:bookingReference');
  console.log('Query: ?contactEmail=guest@example.com');
  console.log('\nResponse includes:');
  console.log(JSON.stringify({
    success: true,
    data: {
      booking_reference: 'BK20251207001',
      status: 'confirmed',
      eTicket: {
        ticketUrl: 'http://localhost:3004/tickets/ticket-BK20251207001-123456.pdf',
        qrCode: 'data:image/png;base64,...'
      }
    }
  }, null, 2));
  
  console.log('\n' + '='.repeat(60));
}

// Run tests
console.log('🚀 Starting Ticket Generation Tests...\n');
printAPIExamples();
testTicketGeneration();
