const QRCode = require('qrcode');
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function updateQRCode() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Generate QR code for booking reference
    const qrCodeUrl = await QRCode.toDataURL('BK20251209001', {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });
    
    console.log('QR Code generated, length:', qrCodeUrl.length);
    
    // Update database
    const result = await client.query(
      'UPDATE bookings SET qr_code_url = $1 WHERE booking_reference = $2',
      [qrCodeUrl, 'BK20251209001']
    );
    
    console.log('✅ QR code updated successfully for BK20251209001');
    console.log('Rows affected:', result.rowCount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

updateQRCode();
