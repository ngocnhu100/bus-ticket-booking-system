const ticketService = require('./src/services/ticketService');

// Direct call to processTicketGeneration
const bookingId = '7b6be4ea-ccd3-4dc9-affa-90ae4e05b950';

ticketService.processTicketGeneration(bookingId)
  .then(result => {
    console.log('\n✅ SUCCESS!');
    console.log('Ticket URL:', result.ticket_url);
    console.log('QR Code:', result.qr_code ? 'Generated' : 'None');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  });
