const ticketService = require('./src/services/ticketService');
const bookingRepository = require('./src/bookingRepository');

async function regenerateTicket(bookingReference) {
  try {
    console.log(`\n🎫 Regenerating ticket for: ${bookingReference}\n`);
    
    // 1. Get booking with full trip details
    const booking = await bookingRepository.findByReferenceWithTripDetails(bookingReference);
    
    if (!booking) {
      throw new Error(`Booking ${bookingReference} not found`);
    }
    
    console.log('✅ Booking found with trip details:');
    console.log(`   Status: ${booking.status}`);
    console.log(`   Route: ${booking.origin_city} → ${booking.destination_city}`);
    console.log(`   Operator: ${booking.operator_name}`);
    console.log(`   Departure: ${booking.departure_time}`);
    console.log(`   Passengers: ${booking.passengers.length}`);
    
    // 2. Generate ticket with full data
    const { ticketUrl, qrCode } = await ticketService.generateTicket(booking);
    
    console.log('\n✅ Ticket generated successfully!');
    console.log(`   PDF URL: ${ticketUrl}`);
    console.log(`   QR Code: ${qrCode.substring(0, 50)}... (${qrCode.length} chars)`);
    
    // 3. Update database
    await bookingRepository.updateTicketInfo(booking.booking_id, {
      ticketUrl,
      qrCode
    });
    
    console.log('✅ Database updated\n');
    console.log(`📄 View ticket at: ${ticketUrl}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get booking reference from command line or use default
const bookingRef = process.argv[2] || 'BK20251209001';

regenerateTicket(bookingRef)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
