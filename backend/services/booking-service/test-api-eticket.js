const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BOOKING_SERVICE_URL = 'http://localhost:3004';

// Mock trip data
const mockTrip = {
  trip_id: 'TRIP_TEST_001',
  departure_location: 'Hà Nội',
  arrival_location: 'Hồ Chí Minh',
  departure_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  arrival_time: new Date(Date.now() + 90000000).toISOString(),
  base_price: 500000,
  available_seats: 40
};

async function testETicketFlow() {
  console.log('🚀 Testing E-Ticket Generation Flow...\n');
  
  try {
    // Generate random seat numbers to avoid conflicts
    const randomSuffix = Math.floor(Math.random() * 1000);
    const seat1 = `A${randomSuffix % 20 + 1}`;
    const seat2 = `B${randomSuffix % 20 + 1}`;
    
    // Step 1: Create booking
    console.log('📝 Step 1: Creating guest booking...');
    const bookingPayload = {
      tripId: mockTrip.trip_id,
      isGuestCheckout: true,
      contactEmail: 'test-eticket@example.com',
      contactPhone: '0901234567',
      passengers: [
        {
          fullName: 'Nguyễn Văn Test',
          seatNumber: seat1,
          documentType: 'CITIZEN_ID',
          documentId: '001234567890',
          phone: '0901111111'
        },
        {
          fullName: 'Trần Thị Test',
          seatNumber: seat2,
          documentType: 'PASSPORT',
          documentId: 'P001234567891',
          phone: '0902222222'
        }
      ],
      totalPrice: 1000000,
      paymentMethod: 'cash'
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/bookings`,
      bookingPayload
    );

    console.log('✅ Booking created successfully!');
    console.log('DEBUG - Full response:', JSON.stringify(createResponse.data, null, 2));
    
    const bookingData = createResponse.data.data || createResponse.data;
    console.log(`   📋 Booking Reference: ${bookingData.booking_reference || bookingData.bookingReference}`);
    console.log(`   🆔 Booking ID: ${bookingData.booking_id || bookingData.bookingId}`);
    console.log(`   📧 Contact Email: ${bookingData.contact_email || bookingData.contactEmail}`);
    console.log(`   💰 Total Price: ${(bookingData.total_price || bookingData.totalPrice || 0).toLocaleString('vi-VN')} VND`);
    console.log(`   ⏱️  Status: ${bookingData.status}\n`);

    const bookingId = bookingData.booking_id || bookingData.bookingId;
    const bookingReference = bookingData.booking_reference || bookingData.bookingReference;
    const contactEmail = bookingData.contact_email || bookingData.contactEmail;

    // Wait a bit before confirming
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Confirm booking (triggers ticket generation)
    console.log('✅ Step 2: Confirming booking (generating ticket)...');
    const confirmResponse = await axios.post(
      `${API_BASE_URL}/bookings/${bookingId}/confirm`
    );

    console.log('✅ Booking confirmed successfully!');
    console.log(`   📋 Reference: ${confirmResponse.data.data.booking_reference}`);
    console.log(`   ⏱️  Status: ${confirmResponse.data.data.status}`);
    
    if (confirmResponse.data.data.eTicket) {
      console.log('   🎫 E-Ticket Generated:');
      console.log(`      📄 PDF URL: ${confirmResponse.data.data.eTicket.ticketUrl || 'Generating...'}`);
      if (confirmResponse.data.data.eTicket.qrCode) {
        console.log(`      🔳 QR Code: ${confirmResponse.data.data.eTicket.qrCode.substring(0, 50)}...`);
      }
    }
    console.log(`   💬 ${confirmResponse.data.message}\n`);

    // Wait for async ticket generation
    console.log('⏳ Waiting 3 seconds for async ticket generation...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Get booking details
    console.log('📖 Step 3: Fetching booking details...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/bookings/${bookingReference}`,
      {
        params: { contactEmail }
      }
    );

    console.log('✅ Booking details retrieved successfully!');
    const booking = getResponse.data.data;
    console.log(`   📋 Reference: ${booking.booking_reference}`);
    console.log(`   ⏱️  Status: ${booking.status}`);
    console.log(`   💳 Payment Status: ${booking.payment_status}`);
    console.log(`   👥 Passengers: ${booking.passengers.length}`);
    
    if (booking.eTicket) {
      console.log('   🎫 E-Ticket:');
      console.log(`      📄 Ticket URL: ${booking.eTicket.ticketUrl || 'Not generated yet'}`);
      console.log(`      🔳 QR Code: ${booking.eTicket.qrCode ? 'Available (' + booking.eTicket.qrCode.length + ' chars)' : 'Not generated yet'}`);
    } else {
      console.log('   ⚠️  E-Ticket not available yet (may still be generating)');
    }
    console.log();

    // Step 4: Try to download PDF
    if (booking.eTicket && booking.eTicket.ticketUrl) {
      console.log('📥 Step 4: Testing PDF download...');
      try {
        const pdfResponse = await axios.get(booking.eTicket.ticketUrl, {
          responseType: 'arraybuffer'
        });
        console.log(`✅ PDF downloaded successfully!`);
        console.log(`   📊 Size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB`);
        console.log(`   📝 Content-Type: ${pdfResponse.headers['content-type']}\n`);
      } catch (pdfError) {
        console.log(`❌ PDF download failed: ${pdfError.message}\n`);
      }
    }

    // Step 5: Check email preview
    console.log('📧 Step 5: Checking email template...');
    const fs = require('fs');
    const path = require('path');
    const emailPreviewPath = path.join(__dirname, 'test-email-preview.html');
    
    if (fs.existsSync(emailPreviewPath)) {
      const stats = fs.statSync(emailPreviewPath);
      console.log(`✅ Email preview found!`);
      console.log(`   📄 File: test-email-preview.html`);
      console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   💡 Open this file in browser to preview email\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ E-TICKET FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📋 Booking Reference: ${bookingReference}`);
    console.log(`🆔 Booking ID: ${bookingId}`);
    console.log(`📧 Contact Email: ${contactEmail}`);
    console.log(`⏱️  Status: ${booking.status}`);
    console.log(`💳 Payment: ${booking.payment_status}`);
    
    if (booking.eTicket) {
      console.log(`\n🎫 E-Ticket Information:`);
      console.log(`   Ticket URL: ${booking.eTicket.ticketUrl}`);
      console.log(`   QR Code: ${booking.eTicket.qrCode ? '✅ Generated' : '❌ Not available'}`);
    }
    
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Open: ${booking.eTicket?.ticketUrl || 'Check tickets/ directory'}`);
    console.log(`   2. Open: test-email-preview.html in browser`);
    console.log(`   3. Check notification service logs for email sending`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.message}`);
      console.error(`   Details:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    console.error('\n⚠️  Make sure all services are running:');
    console.error('   - API Gateway: http://localhost:3000');
    console.error('   - Booking Service: http://localhost:3004');
    console.error('   - Notification Service: http://localhost:3003');
    console.error('   - PostgreSQL database');
    console.error('   - Redis');
  }
}

// Run the test
testETicketFlow();
