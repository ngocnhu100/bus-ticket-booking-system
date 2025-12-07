// Quick test to confirm a booking and get the result with eTicket
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Use one of the existing bookings
const BOOKING_REF = 'BK20251207058'; // From our test
const BOOKING_ID = 'fc808282-fed0-4231-abab-112733acc9d0';
const CONTACT_EMAIL = 'test-eticket@example.com';

async function testUIBooking() {
  console.log('🧪 Testing UI Booking Lookup with E-Ticket\n');
  
  try {
    // Get booking details
    console.log(`📖 Fetching booking: ${BOOKING_REF}...`);
    const response = await axios.get(
      `${API_BASE_URL}/bookings/${BOOKING_REF}`,
      {
        params: { contactEmail: CONTACT_EMAIL }
      }
    );

    console.log('\n✅ Booking Retrieved Successfully!\n');
    console.log(JSON.stringify(response.data.data, null, 2));
    
    const booking = response.data.data;
    
    console.log('\n📊 Quick Summary:');
    console.log(`   Reference: ${booking.booking_reference}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Payment: ${booking.payment_status}`);
    console.log(`   Email: ${booking.contact_email}`);
    
    if (booking.eTicket) {
      console.log('\n🎫 E-Ticket:');
      console.log(`   Has Ticket URL: ${!!booking.eTicket.ticketUrl}`);
      console.log(`   Has QR Code: ${!!booking.eTicket.qrCode}`);
      if (booking.eTicket.ticketUrl) {
        console.log(`   Ticket URL: ${booking.eTicket.ticketUrl}`);
      }
      if (booking.eTicket.qrCode) {
        console.log(`   QR Code Length: ${booking.eTicket.qrCode.length} chars`);
      }
    } else {
      console.log('\n⚠️  No eTicket found!');
    }
    
    console.log('\n📝 Test on UI:');
    console.log(`   1. Go to: http://localhost:5174/booking-lookup`);
    console.log(`   2. Enter Reference: ${BOOKING_REF}`);
    console.log(`   3. Enter Email: ${CONTACT_EMAIL}`);
    console.log(`   4. Click "Look Up Booking"`);
    console.log(`   5. Should see E-Ticket section with QR code and download button\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testUIBooking();
