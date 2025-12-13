/**
 * Booking Confirmation Email Template
 * Comprehensive email sent immediately after successful payment
 */

const generateBookingConfirmationTemplate = (bookingData) => {
  const {
    bookingReference,
    customerName,
    customerEmail,
    customerPhone,
    tripDetails,
    passengers,
    pricing,
    eTicketUrl,
    qrCodeUrl,
    bookingDetailsUrl,
    cancellationPolicy,
    operatorContact,
  } = bookingData;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date/time
  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const passengersHtml = passengers
    .map(
      (p, idx) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: center; color: #666;">${idx + 1}</td>
      <td style="padding: 12px; color: #333;">${p.fullName}</td>
      <td style="padding: 12px; color: #333;">${p.documentId}</td>
      <td style="padding: 12px; color: #333;">${p.seatCode}</td>
      <td style="padding: 12px; text-align: right; color: #333;">${formatCurrency(p.seatPrice)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Nhận Đặt Vé - ${bookingReference}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
        }
        .booking-ref {
            background-color: rgba(255,255,255,0.2);
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 10px 0 0 0;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
        }
        .success-badge {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 25px;
            color: #155724;
            text-align: center;
            font-weight: bold;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            width: 40%;
        }
        .info-value {
            color: #333;
            text-align: right;
            width: 60%;
        }
        .trip-header {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .trip-route {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .trip-time {
            color: #666;
            font-size: 14px;
        }
        .trip-time strong {
            color: #333;
        }
        .passenger-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        .passenger-table thead {
            background-color: #667eea;
            color: white;
        }
        .passenger-table th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
        }
        .passenger-table td {
            padding: 12px;
        }
        .pricing-box {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .price-row:last-child {
            margin-bottom: 0;
        }
        .price-label {
            color: #666;
        }
        .price-value {
            color: #333;
            font-weight: 500;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            margin-top: 10px;
            border-top: 2px solid #ddd;
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .total-value {
            color: #667eea;
            font-size: 18px;
        }
        .cta-buttons {
            display: flex;
            gap: 10px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .btn {
            flex: 1;
            min-width: 200px;
            padding: 14px 24px;
            text-align: center;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background-color: #5568d3;
        }
        .btn-secondary {
            background-color: #e0e0e0;
            color: #333;
        }
        .btn-secondary:hover {
            background-color: #d0d0d0;
        }
        .policy-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #856404;
        }
        .policy-box strong {
            color: #333;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0e0e0;
        }
        .footer-link {
            color: #667eea;
            text-decoration: none;
        }
        .qr-section {
            text-align: center;
            margin: 20px 0;
        }
        .qr-image {
            max-width: 150px;
            height: auto;
        }
        .contact-info {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 2px;
        }
        .contact-info-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .contact-info-text {
            color: #666;
            font-size: 13px;
            margin: 3px 0;
        }
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            .header {
                padding: 20px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .cta-buttons {
                flex-direction: column;
            }
            .btn {
                min-width: 100%;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label,
            .info-value {
                width: 100%;
                text-align: left;
            }
            .price-row {
                padding: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>✓ Đặt Vé Thành Công</h1>
            <div class="booking-ref">${bookingReference}</div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                Xin chào <strong>${customerName}</strong>,<br>
                Cảm ơn bạn đã đặt vé với chúng tôi! Đặt vé của bạn đã được xác nhận thành công.
            </div>

            <!-- Success Badge -->
            <div class="success-badge">
                ✓ Thanh toán đã được xác nhận - Vé của bạn đã được bảo lưu
            </div>

            <!-- Trip Details Section -->
            <div class="section-title">📍 Chi Tiết Chuyến Xe</div>
            <div class="trip-header">
                <div class="trip-route">
                    ${tripDetails.origin} → ${tripDetails.destination}
                </div>
                <div class="trip-time">
                    <strong>Khởi hành:</strong> ${formatDateTime(tripDetails.departureTime)}<br>
                    <strong>Dự kiến đến:</strong> ${formatDateTime(tripDetails.arrivalTime)}<br>
                    <strong>Nhà xe:</strong> ${tripDetails.operatorName} (${tripDetails.busModel})
                </div>
            </div>

            <!-- Pickup & Dropoff Points -->
            <div class="info-row">
                <div class="info-label">📍 Điểm đón:</div>
                <div class="info-value">${tripDetails.pickupPoint}</div>
            </div>
            <div class="info-row">
                <div class="info-label">📍 Điểm trả:</div>
                <div class="info-value">${tripDetails.dropoffPoint}</div>
            </div>

            <!-- Passengers Section -->
            <div class="section-title">👥 Danh Sách Hành Khách</div>
            <table class="passenger-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">TT</th>
                        <th style="width: 30%;">Họ Tên</th>
                        <th style="width: 28%;">CMND/CCCD</th>
                        <th style="width: 15%;">Ghế</th>
                        <th style="width: 19%;">Giá</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengersHtml}
                </tbody>
            </table>

            <!-- Pricing Section -->
            <div class="section-title">💰 Chi Tiết Giá Vé</div>
            <div class="pricing-box">
                <div class="price-row">
                    <span class="price-label">Giá vé (${passengers.length} chỗ × ${formatCurrency(pricing.basePrice)}):</span>
                    <span class="price-value">${formatCurrency(pricing.subtotal)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Phí dịch vụ:</span>
                    <span class="price-value">${formatCurrency(pricing.serviceFee)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Phương thức thanh toán:</span>
                    <span class="price-value">${pricing.paymentMethod}</span>
                </div>
                <div class="total-row">
                    <span>Tổng cộng:</span>
                    <span class="total-value">${formatCurrency(pricing.total)}</span>
                </div>
            </div>

            <!-- Payment Information -->
            <div class="section-title">💳 Thông Tin Thanh Toán</div>
            <div class="info-row">
                <div class="info-label">Trạng thái:</div>
                <div class="info-value" style="color: #28a745; font-weight: bold;">✓ Đã thanh toán</div>
            </div>
            <div class="info-row">
                <div class="info-label">Mã giao dịch:</div>
                <div class="info-value">${bookingReference}</div>
            </div>

            <!-- CTA Buttons -->
            <div class="cta-buttons">
                <a href="${eTicketUrl}" class="btn btn-primary">📥 Tải Vé Điện Tử</a>
                <a href="${bookingDetailsUrl}" class="btn btn-secondary">👁️ Xem Chi Tiết</a>
            </div>

            <!-- QR Code -->
            <div class="qr-section">
                <p style="color: #666; margin-bottom: 10px;">Mã QR của bạn:</p>
                <img src="${qrCodeUrl}" alt="QR Code" class="qr-image">
            </div>

            <!-- Cancellation Policy -->
            <div class="section-title">📋 Chính Sách Hủy Vé</div>
            <div class="policy-box">
                <strong>Chính sách hủy vé:</strong><br>
                ${cancellationPolicy}
                <br><br>
                <strong>Lưu ý:</strong> Vui lòng đến trạm xe 30 phút trước giờ khởi hành. 
                Bạn có thể kiểm tra trạng thái chuyến xe và liên hệ với nhà xe qua thông tin dưới đây.
            </div>

            <!-- Contact Information -->
            <div class="section-title">📞 Thông Tin Liên Hệ</div>
            <div class="contact-info">
                <div class="contact-info-title">Nhà Xe: ${tripDetails.operatorName}</div>
                <div class="contact-info-text">
                    <strong>Điện thoại:</strong> ${operatorContact.phone}<br>
                    <strong>Email:</strong> ${operatorContact.email}<br>
                    <strong>Website:</strong> ${operatorContact.website || 'N/A'}
                </div>
            </div>

            <!-- Instructions -->
            <div class="section-title">ℹ️ Hướng Dẫn</div>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; color: #666; font-size: 13px; line-height: 1.8;">
                <strong>1. Tải vé điện tử:</strong> Nhấp vào nút "Tải Vé Điện Tử" hoặc mở email để tải PDF<br>
                <strong>2. Kiểm tra thông tin:</strong> Đảm bảo tất cả thông tin hành khách chính xác<br>
                <strong>3. Đến trạm sớm:</strong> Vui lòng đến 30 phút trước giờ khởi hành<br>
                <strong>4. Mang theo vé:</strong> In vé hoặc hiển thị trên điện thoại khi lên xe<br>
                <strong>5. Theo dõi chuyến:</strong> Kiểm tra thường xuyên để nhận thông báo cập nhật chuyến xe
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi:
                <a href="mailto:support@busticket.com" class="footer-link">support@busticket.com</a> 
                hoặc gọi <strong>1800-XXXX</strong>
            </p>
            <p style="margin-top: 15px;">
                <a href="https://busticket.com/terms" class="footer-link">Điều Khoản &amp; Điều Kiện</a> | 
                <a href="https://busticket.com/privacy" class="footer-link">Chính Sách Bảo Mật</a>
            </p>
            <p style="margin-top: 15px; color: #ccc;">
                © 2025 Bus Ticket Booking System. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

module.exports = {
  generateBookingConfirmationTemplate,
};
