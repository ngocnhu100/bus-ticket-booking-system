const QRCode = require('qrcode');

class QRGenerator {
  /**
   * Generate QR code as base64 data URL
   * @param {string} data - Data to encode in QR code
   * @param {object} options - QR code options
   * @returns {Promise<string>} Base64 data URL
   */
  async generateQRCode(data, options = {}) {
    try {
      const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      const qrOptions = { ...defaultOptions, ...options };
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);
      
      console.log(`✅ QR code generated for: ${data.substring(0, 50)}...`);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as buffer
   * @param {string} data - Data to encode in QR code
   * @param {object} options - QR code options
   * @returns {Promise<Buffer>} QR code image buffer
   */
  async generateQRCodeBuffer(data, options = {}) {
    try {
      const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.92,
        margin: 1,
        width: 300
      };

      const qrOptions = { ...defaultOptions, ...options };
      
      const buffer = await QRCode.toBuffer(data, qrOptions);
      
      console.log(`✅ QR code buffer generated for: ${data.substring(0, 50)}...`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Generate booking verification QR code
   * Contains booking reference only for simple scanning
   * @param {string} bookingReference - Booking reference number
   * @param {string} bookingId - Booking UUID (optional, not used in simple mode)
   * @returns {Promise<string>} Base64 data URL
   */
  async generateBookingQR(bookingReference, bookingId) {
    // QR code contains only booking reference for simplicity
    // Staff can scan this and look up the booking in their system
    return await this.generateQRCode(bookingReference, {
      width: 300,
      errorCorrectionLevel: 'H'
    });
  }
}

module.exports = new QRGenerator();
