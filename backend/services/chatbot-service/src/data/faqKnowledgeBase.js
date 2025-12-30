/**
 * FAQ Knowledge Base
 * Contains frequently asked questions and answers for the chatbot
 */

const FAQ_KNOWLEDGE_BASE = {
  en: {
    cancellation_policy: {
      question: 'What is your cancellation policy?',
      answer: `Our cancellation policy is as follows:

📅 **More than 24 hours before departure:**
- Full refund minus 10% service fee

📅 **12-24 hours before departure:**
- 50% refund

📅 **6-12 hours before departure:**
- 25% refund

📅 **Less than 6 hours before departure:**
- No refund available

⚠️ **Important Notes:**
- Refunds are processed within 3-5 business days
- Refund is sent to the original payment method
- In case of emergency, please contact our support team for exceptions

To cancel your booking, you can:
1. Log in to your account and go to "My Bookings"
2. Use the "Find My Booking" feature with your booking reference
3. Contact our support team at support@busticket.com or call 1900-xxxx`,
      keywords: ['cancel', 'cancellation', 'policy', 'refund time', 'when cancel'],
      relatedLinks: [
        { text: 'My Bookings', url: '/bookings' },
        { text: 'Find My Booking', url: '/find-booking' },
        { text: 'Contact Support', url: '/contact' }
      ]
    },

    refund_policy: {
      question: 'How do refunds work?',
      answer: `💰 **Refund Process:**

**Processing Time:**
- Refunds are initiated immediately upon cancellation approval
- Bank processing takes 3-5 business days
- E-wallet refunds (MoMo, ZaloPay) take 1-2 business days

**Refund Amount:**
Depends on when you cancel:
- More than 24 hours: Full refund - 10% service fee
- 12-24 hours: 50% refund
- 6-12 hours: 25% refund
- Less than 6 hours: No refund

**Refund Method:**
- Refund goes to your original payment method
- For cash payments, refund by bank transfer (provide bank details)

**Track Your Refund:**
- Check refund status in "My Bookings"
- Email notification when refund is processed
- Contact support if refund delayed beyond 5 business days

Need help? Contact support@busticket.com`,
      keywords: ['refund', 'money back', 'how long refund', 'refund time', 'get money back'],
      relatedLinks: [
        { text: 'My Bookings', url: '/bookings' },
        { text: 'Contact Support', url: '/contact' }
      ]
    },

    luggage_allowance: {
      question: 'What is the luggage allowance?',
      answer: `🎒 **Luggage Policy:**

**Standard Allowance (Per Passenger):**
- 1 large suitcase (max 20kg)
- 1 small carry-on bag or backpack (max 7kg)
- Total weight limit: 27kg

**Size Restrictions:**
- Large luggage: max 75cm x 55cm x 35cm
- Carry-on: max 40cm x 30cm x 20cm

**Additional Items:**
- Laptop bag or handbag (free)
- Baby stroller (free)
- Musical instruments (in soft case, subject to space)

**Prohibited Items:**
❌ Weapons or sharp objects
❌ Flammable or explosive materials
❌ Illegal drugs or substances
❌ Pets (except service animals with documentation)
❌ Strong-smelling food or durian

**Excess Luggage:**
- Extra luggage: 50,000 VND per 5kg
- Pay directly to driver before departure
- Subject to available storage space

**Tips:**
✅ Label all luggage with your name and phone
✅ Keep valuables in carry-on
✅ Lock your suitcase
✅ Arrive early if you have extra luggage`,
      keywords: ['luggage', 'baggage', 'bag', 'suitcase', 'carry', 'allowance', 'weight limit', 'how much luggage'],
      relatedLinks: [
        { text: 'Terms & Conditions', url: '/terms' }
      ]
    },

    booking_modifications: {
      question: 'Can I modify my booking?',
      answer: `✏️ **Booking Modification:**

**What Can Be Modified:**
✅ Passenger names (up to 24 hours before departure)
✅ Contact information (phone, email) - anytime
✅ Seat selection (if seats available)

**What Cannot Be Modified:**
❌ Departure date/time (must cancel and rebook)
❌ Route (origin/destination) (must cancel and rebook)
❌ Trip (must cancel and rebook)

**Modification Fees:**
- Passenger name change: 50,000 VND per passenger
- Seat change: 30,000 VND (if different price, pay difference)
- Contact info: FREE

**How to Modify:**
1. Log in to your account → "My Bookings"
2. Select the booking → Click "Modify"
3. Make changes and pay any applicable fees
4. New e-ticket will be sent via email

**Guest Users:**
1. Go to "Find My Booking"
2. Enter booking reference and email
3. Follow modification steps

**Time Restrictions:**
⏰ Modifications must be made at least 6 hours before departure
⏰ Name changes must be made at least 24 hours before departure

**Need Help?**
Contact support@busticket.com or call 1900-xxxx`,
      keywords: ['modify', 'change', 'edit', 'update', 'booking modification', 'change name', 'change seat'],
      relatedLinks: [
        { text: 'My Bookings', url: '/bookings' },
        { text: 'Find My Booking', url: '/find-booking' },
        { text: 'Contact Support', url: '/contact' }
      ]
    },

    payment_methods: {
      question: 'What payment methods do you accept?',
      answer: `💳 **Payment Methods:**

**E-Wallets:**
🔵 MoMo - Instant confirmation
🔵 ZaloPay - Instant confirmation
🔵 PayOS - Instant confirmation

**Credit/Debit Cards:**
💳 Visa
💳 Mastercard
💳 JCB
💳 American Express

**Bank Transfer:**
🏦 Domestic bank transfer
🏦 Internet banking

**Payment Process:**
1. Complete booking form
2. Review booking summary
3. Select payment method
4. Complete payment within 10 minutes
5. Receive e-ticket via email

**Payment Security:**
🔒 SSL encrypted transactions
🔒 PCI DSS compliant
🔒 No card details stored on our servers

**Important Notes:**
⚠️ Complete payment within 10 minutes or booking expires
⚠️ Seat locks are released if payment not completed
⚠️ One-time payment only (no installments)
⚠️ Receipts sent via email automatically

**Failed Payment?**
- Check card balance/limit
- Verify card is enabled for online payments
- Contact your bank
- Try different payment method
- Contact support if issue persists

**Need Help?**
support@busticket.com or 1900-xxxx`,
      keywords: ['payment', 'pay', 'credit card', 'momo', 'zalopay', 'payos', 'how to pay', 'payment method'],
      relatedLinks: [
        { text: 'Search Trips', url: '/search' },
        { text: 'Payment FAQ', url: '/faq#payment' }
      ]
    },

    eticket_usage: {
      question: 'How do I use my e-ticket?',
      answer: `🎫 **E-Ticket Usage Guide:**

**What is an E-Ticket?**
- Digital ticket sent to your email after payment
- Contains booking details and QR code
- Valid ID for boarding

**How to Use:**
1. **Download** - Save PDF to phone or print
2. **Arrive Early** - Come 15 minutes before departure
3. **Show Ticket** - Present QR code or PDF to driver/staff
4. **Board Bus** - Scan will verify your booking

**E-Ticket Contains:**
📋 Booking reference number
📋 Passenger name(s)
📋 Seat number(s)
📋 Departure time and location
📋 Arrival time and location
📋 Bus information
📋 QR code for scanning

**Display Options:**
📱 Show on mobile phone screen
🖨️ Print on paper
💾 Save in email/cloud storage

**Didn't Receive E-Ticket?**
1. Check spam/junk folder
2. Verify email address in booking
3. Download from "My Bookings" section
4. Contact support to resend

**Lost E-Ticket?**
✅ Log in → "My Bookings" → Download again
✅ Use "Find My Booking" with reference number
✅ Contact support with booking reference

**Boarding Requirements:**
✅ E-ticket (digital or printed)
✅ Valid ID matching passenger name
✅ Arrive 15 minutes early

**Important:**
⚠️ One e-ticket per passenger
⚠️ QR code must be intact and readable
⚠️ Screenshots are acceptable if QR code is clear`,
      keywords: ['e-ticket', 'eticket', 'ticket', 'qr code', 'how to board', 'boarding', 'show ticket'],
      relatedLinks: [
        { text: 'My Bookings', url: '/bookings' },
        { text: 'Find My Booking', url: '/find-booking' },
        { text: 'Download E-Ticket', url: '/bookings' }
      ]
    },

    booking_process: {
      question: 'How do I book a ticket?',
      answer: `📝 **Step-by-Step Booking Guide:**

**Step 1: Search for Trips**
- Enter origin city (from)
- Enter destination city (to)
- Select departure date
- Choose number of passengers
- Click "Search"

**Step 2: Select Trip**
- Browse available trips
- Filter by time, price, bus type
- Compare options
- Click "Select" on preferred trip

**Step 3: Choose Seats**
- View seat map
- Select available seats (green)
- Cannot select occupied seats (gray)
- Seats lock for 10 minutes

**Step 4: Enter Passenger Details**
- Full name (as on ID)
- ID/Passport number
- Phone number
- Email address

**Step 5: Review & Pay**
- Verify all details
- Read cancellation policy
- Select payment method
- Complete payment within 10 minutes

**Step 6: Receive E-Ticket**
- E-ticket sent to email immediately
- Save or print for boarding
- Check "My Bookings" anytime

**Guest Checkout:**
✅ No account needed
✅ Use "Find My Booking" to access later
✅ Create account anytime to manage bookings

**Need Help?**
💬 Chat with me about your journey
📞 Call 1900-xxxx
📧 Email support@busticket.com`,
      keywords: ['how to book', 'booking process', 'book ticket', 'reserve', 'how book', 'buy ticket'],
      relatedLinks: [
        { text: 'Search Trips', url: '/search' },
        { text: 'How It Works', url: '/how-it-works' }
      ]
    },

    guest_booking: {
      question: 'Can I book without an account?',
      answer: `👤 **Guest Booking:**

**Yes! You Can Book Without an Account**

**Guest Checkout Features:**
✅ Quick booking process
✅ No registration required
✅ Just provide email and phone
✅ E-ticket sent immediately
✅ Can still cancel/modify

**How to Access Your Booking:**
1. Use "Find My Booking" feature
2. Enter booking reference number (e.g., BK20251115001)
3. Enter email used for booking
4. View details, download e-ticket, or cancel

**Benefits of Creating Account:**
- View all bookings in one place
- Faster checkout (saved details)
- Booking history tracking
- Exclusive offers and promotions
- Easy modifications

**Create Account Anytime:**
After guest booking, you can create account and link your booking automatically.

**Security:**
🔒 Your data is encrypted and secure
🔒 We don't share your information
🔒 GDPR compliant

**Guest Booking Steps:**
1. Search and select trip
2. Choose seats
3. Enter contact info (no password needed)
4. Pay and receive e-ticket

**Find Your Booking:**
📧 Booking reference in confirmation email
📱 Save reference number for easy access
🔍 "Find My Booking" on website`,
      keywords: ['guest', 'no account', 'without account', 'no registration', 'guest checkout', 'book without login'],
      relatedLinks: [
        { text: 'Find My Booking', url: '/find-booking' },
        { text: 'Search Trips', url: '/search' },
        { text: 'Create Account', url: '/register' }
      ]
    },

    seat_selection: {
      question: 'How does seat selection work?',
      answer: `💺 **Seat Selection Guide:**

**Seat Status Colors:**
🟢 Green = Available (you can select)
⚫ Gray = Occupied (already booked)
🔵 Blue = Your selection
🔴 Red = Locked by another user

**How to Select:**
1. View seat map after choosing trip
2. Click on available (green) seats
3. Click again to deselect
4. Confirm selection to lock seats

**Seat Locking:**
⏰ Selected seats lock for 10 minutes
⏰ Timer shows remaining time
⏰ Complete booking before time expires
⏰ Lock extends with each action

**Seat Types:**
🪟 Window seats - Great views
🚶 Aisle seats - Easy access
⭐ VIP seats - Extra space (may cost more)
👥 Standard seats - Regular seating

**Tips:**
✅ Front seats - Less motion, first to exit
✅ Middle seats - Smoothest ride
✅ Back seats - More privacy, near toilet
✅ Window seats - Rest your head, scenic views
✅ Aisle seats - More legroom, easy bathroom access

**Multi-Passenger Booking:**
- Select multiple seats for your group
- Seats must be available
- One booking for all passengers
- Enter details for each passenger

**Cannot Select Seat?**
❌ Already occupied by another passenger
❌ Locked by another user (wait 10 minutes)
❌ Reserved for special needs
❌ Not part of bookable area (driver, door, etc.)

**Seat Prices:**
- Most seats: Standard price
- VIP/Premium seats: May have surcharge
- Price shown when selecting seat`,
      keywords: ['seat', 'select seat', 'seat map', 'choose seat', 'seat selection', 'seat lock', 'which seat'],
      relatedLinks: [
        { text: 'Search Trips', url: '/search' },
        { text: 'Booking Guide', url: '/how-it-works' }
      ]
    },

    contact_support: {
      question: 'How can I contact support?',
      answer: `📞 **Contact Support:**

**Customer Service:**
📧 Email: support@busticket.com
📞 Hotline: 1900-xxxx (24/7)
💬 Live Chat: Available on website
🤖 Chatbot: I'm here to help!

**Response Times:**
- Chat/Chatbot: Immediate
- Hotline: Immediate
- Email: Within 24 hours
- Social Media: Within 4 hours

**Office Hours:**
🕐 24/7 for emergencies
🕐 8:00 AM - 10:00 PM for general inquiries

**Social Media:**
📘 Facebook: /BusTicketBooking
📷 Instagram: @busticketbooking
🐦 Twitter: @BusTicketBook

**Head Office:**
📍 123 Nguyen Hue Street
   District 1, Ho Chi Minh City
   Vietnam

**What We Can Help With:**
✅ Booking issues
✅ Payment problems
✅ Cancellation/refunds
✅ Technical support
✅ General inquiries
✅ Complaints and feedback

**Before Contacting:**
Please have ready:
- Booking reference number
- Email used for booking
- Details of your issue
- Screenshots (if applicable)

**Emergency on Trip?**
🚨 Call driver directly (number on e-ticket)
🚨 Call emergency hotline: 1900-xxxx
🚨 Use bus emergency button

**Want to:**
- Report an issue → support@busticket.com
- Give feedback → feedback@busticket.com
- Business inquiries → business@busticket.com`,
      keywords: ['contact', 'support', 'help', 'customer service', 'phone number', 'email', 'call', 'reach', 'talk to human'],
      relatedLinks: [
        { text: 'Contact Page', url: '/contact' },
        { text: 'Help Center', url: '/help' },
        { text: 'FAQ', url: '/faq' }
      ]
    }
  },

  vi: {
    cancellation_policy: {
      question: 'Chính sách hủy vé như thế nào?',
      answer: `Chính sách hủy vé của chúng tôi như sau:

📅 **Hơn 24 giờ trước giờ khởi hành:**
- Hoàn tiền đầy đủ trừ 10% phí dịch vụ

📅 **12-24 giờ trước giờ khởi hành:**
- Hoàn 50% tiền vé

📅 **6-12 giờ trước giờ khởi hành:**
- Hoàn 25% tiền vé

📅 **Dưới 6 giờ trước giờ khởi hành:**
- Không hoàn tiền

⚠️ **Lưu ý quan trọng:**
- Tiền hoàn được xử lý trong vòng 3-5 ngày làm việc
- Hoàn tiền về phương thức thanh toán ban đầu
- Trường hợp khẩn cấp, vui lòng liên hệ bộ phận hỗ trợ

Để hủy vé, bạn có thể:
1. Đăng nhập tài khoản và vào "Vé của tôi"
2. Sử dụng tính năng "Tra cứu vé" với mã đặt vé
3. Liên hệ bộ phận hỗ trợ qua email support@busticket.com hoặc gọi 1900-xxxx`,
      keywords: ['hủy', 'hủy vé', 'chính sách hủy', 'hoàn tiền', 'khi nào hủy', 'cancel', 'cancellation', 'hủy đặt vé', 'chính sách hoàn vé'],
      relatedLinks: [
        { text: 'Vé của tôi', url: '/bookings' },
        { text: 'Tra cứu vé', url: '/find-booking' },
        { text: 'Liên hệ hỗ trợ', url: '/contact' }
      ]
    },

    refund_policy: {
      question: 'Hoàn tiền như thế nào?',
      answer: `💰 **Quy trình hoàn tiền:**

**Thời gian xử lý:**
- Hoàn tiền được khởi tạo ngay khi hủy vé được chấp thuận
- Ngân hàng xử lý trong 3-5 ngày làm việc
- Ví điện tử (MoMo, ZaloPay) mất 1-2 ngày làm việc

**Số tiền hoàn:**
Phụ thuộc vào thời gian hủy:
- Hơn 24 giờ: Hoàn đầy đủ - 10% phí dịch vụ
- 12-24 giờ: Hoàn 50%
- 6-12 giờ: Hoàn 25%
- Dưới 6 giờ: Không hoàn tiền

**Phương thức hoàn tiền:**
- Hoàn về phương thức thanh toán ban đầu
- Thanh toán tiền mặt: Hoàn qua chuyển khoản (cung cấp tài khoản ngân hàng)

**Theo dõi hoàn tiền:**
- Kiểm tra trạng thái trong "Vé của tôi"
- Thông báo email khi hoàn tiền được xử lý
- Liên hệ hỗ trợ nếu chậm hơn 5 ngày làm việc

Cần hỗ trợ? Liên hệ support@busticket.com`,
      keywords: ['hoàn tiền', 'trả tiền', 'hoàn lại', 'mất bao lâu hoàn tiền', 'nhận tiền', 'hoàn vé', 'refund', 'hoàn tiền như thế nào', 'quy trình hoàn tiền', 'chính sách hoàn tiền'],
      relatedLinks: [
        { text: 'Vé của tôi', url: '/bookings' },
        { text: 'Liên hệ hỗ trợ', url: '/contact' }
      ]
    },

    luggage_allowance: {
      question: 'Quy định về hành lý?',
      answer: `🎒 **Chính sách hành lý:**

**Định mức chuẩn (Mỗi hành khách):**
- 1 vali lớn (tối đa 20kg)
- 1 túi xách tay hoặc ba lô nhỏ (tối đa 7kg)
- Tổng trọng lượng: 27kg

**Giới hạn kích thước:**
- Hành lý lớn: tối đa 75cm x 55cm x 35cm
- Xách tay: tối đa 40cm x 30cm x 20cm

**Vật phẩm bổ sung:**
- Túi laptop hoặc túi xách (miễn phí)
- Xe đẩy em bé (miễn phí)
- Nhạc cụ (trong bao mềm, tùy chỗ trống)

**Vật phẩm cấm:**
❌ Vũ khí hoặc đồ sắc nhọn
❌ Chất dễ cháy nổ
❌ Ma túy hoặc chất cấm
❌ Thú cưng (trừ động vật phục vụ có giấy tờ)
❌ Thực phẩm có mùi mạnh hoặc sầu riêng

**Hành lý vượt mức:**
- Thêm 50.000đ cho mỗi 5kg
- Thanh toán trực tiếp với tài xế trước khi khởi hành
- Tùy thuộc vào chỗ chứa có sẵn

**Lưu ý:**
✅ Gắn nhãn tên và số điện thoại trên hành lý
✅ Giữ đồ giá trị trong túi xách tay
✅ Khóa vali của bạn
✅ Đến sớm nếu có hành lý nhiều`,
      keywords: ['hành lý', 'túi', 'vali', 'xách tay', 'mang theo', 'định mức', 'giới hạn cân nặng', 'bao nhiêu kg'],
      relatedLinks: [
        { text: 'Điều khoản & Điều kiện', url: '/terms' }
      ]
    },

    booking_modifications: {
      question: 'Có thể thay đổi thông tin đặt vé không?',
      answer: `✏️ **Thay đổi thông tin đặt vé:**

**Có thể thay đổi:**
✅ Tên hành khách (tối đa 24 giờ trước khởi hành)
✅ Thông tin liên lạc (điện thoại, email) - bất cứ lúc nào
✅ Chọn ghế (nếu còn ghế trống)

**Không thể thay đổi:**
❌ Ngày/giờ khởi hành (phải hủy và đặt lại)
❌ Tuyến đường (điểm đi/đến) (phải hủy và đặt lại)
❌ Chuyến xe (phải hủy và đặt lại)

**Phí thay đổi:**
- Đổi tên hành khách: 50.000đ/hành khách
- Đổi ghế: 30.000đ (nếu giá khác, trả thêm chênh lệch)
- Thông tin liên lạc: MIỄN PHÍ

**Cách thay đổi:**
1. Đăng nhập → "Vé của tôi"
2. Chọn vé → Nhấn "Thay đổi"
3. Thực hiện thay đổi và thanh toán phí (nếu có)
4. Vé điện tử mới sẽ được gửi qua email

**Khách vãng lai:**
1. Vào "Tra cứu vé"
2. Nhập mã đặt vé và email
3. Làm theo hướng dẫn thay đổi

**Giới hạn thời gian:**
⏰ Phải thay đổi ít nhất 6 giờ trước khởi hành
⏰ Đổi tên phải thực hiện ít nhất 24 giờ trước khởi hành

**Cần hỗ trợ?**
Liên hệ support@busticket.com hoặc gọi 1900-xxxx`,
      keywords: ['thay đổi', 'sửa', 'chỉnh sửa', 'cập nhật', 'đổi tên', 'đổi ghế', 'sửa thông tin'],
      relatedLinks: [
        { text: 'Vé của tôi', url: '/bookings' },
        { text: 'Tra cứu vé', url: '/find-booking' },
        { text: 'Liên hệ hỗ trợ', url: '/contact' }
      ]
    },

    payment_methods: {
      question: 'Có những phương thức thanh toán nào?',
      answer: `💳 **Phương thức thanh toán:**

**Ví điện tử:**
🔵 MoMo - Xác nhận ngay lập tức
🔵 ZaloPay - Xác nhận ngay lập tức
🔵 PayOS - Xác nhận ngay lập tức

**Thẻ tín dụng/ghi nợ:**
💳 Visa
💳 Mastercard
💳 JCB
💳 American Express

**Chuyển khoản ngân hàng:**
🏦 Chuyển khoản nội địa
🏦 Internet banking

**Quy trình thanh toán:**
1. Hoàn thành form đặt vé
2. Xem lại thông tin đặt vé
3. Chọn phương thức thanh toán
4. Hoàn tất thanh toán trong 10 phút
5. Nhận vé điện tử qua email

**Bảo mật thanh toán:**
🔒 Giao dịch mã hóa SSL
🔒 Tuân thủ PCI DSS
🔒 Không lưu thông tin thẻ trên máy chủ

**Lưu ý quan trọng:**
⚠️ Hoàn tất thanh toán trong 10 phút hoặc đặt vé hết hạn
⚠️ Ghế được mở khóa nếu không hoàn tất thanh toán
⚠️ Chỉ thanh toán một lần (không trả góp)
⚠️ Hóa đơn tự động gửi qua email

**Thanh toán thất bại?**
- Kiểm tra số dư/hạn mức thẻ
- Xác minh thẻ được kích hoạt thanh toán online
- Liên hệ ngân hàng
- Thử phương thức thanh toán khác
- Liên hệ hỗ trợ nếu vấn đề tiếp tục

**Cần hỗ trợ?**
support@busticket.com hoặc 1900-xxxx`,
      keywords: ['thanh toán', 'trả tiền', 'thẻ tín dụng', 'momo', 'zalopay', 'payos', 'cách thanh toán', 'phương thức'],
      relatedLinks: [
        { text: 'Tìm chuyến', url: '/search' },
        { text: 'Câu hỏi thanh toán', url: '/faq#payment' }
      ]
    },

    eticket_usage: {
      question: 'Cách sử dụng vé điện tử?',
      answer: `🎫 **Hướng dẫn sử dụng vé điện tử:**

**Vé điện tử là gì?**
- Vé kỹ thuật số gửi qua email sau khi thanh toán
- Chứa thông tin đặt vé và mã QR
- Giấy tờ hợp lệ để lên xe

**Cách sử dụng:**
1. **Tải xuống** - Lưu PDF vào điện thoại hoặc in ra
2. **Đến sớm** - Có mặt 15 phút trước giờ khởi hành
3. **Xuất trình vé** - Đưa mã QR hoặc PDF cho tài xế/nhân viên
4. **Lên xe** - Quét mã sẽ xác thực đặt vé của bạn

**Vé điện tử chứa:**
📋 Số tham chiếu đặt vé
📋 Tên hành khách
📋 Số ghế
📋 Giờ và địa điểm khởi hành
📋 Giờ và địa điểm đến
📋 Thông tin xe
📋 Mã QR để quét

**Tùy chọn hiển thị:**
📱 Hiển thị trên màn hình điện thoại
🖨️ In trên giấy
💾 Lưu trong email/đám mây

**Không nhận được vé điện tử?**
1. Kiểm tra thư mục spam/rác
2. Xác minh địa chỉ email trong đặt vé
3. Tải xuống từ mục "Vé của tôi"
4. Liên hệ hỗ trợ để gửi lại

**Mất vé điện tử?**
✅ Đăng nhập → "Vé của tôi" → Tải lại
✅ Dùng "Tra cứu vé" với số tham chiếu
✅ Liên hệ hỗ trợ với số tham chiếu đặt vé

**Yêu cầu lên xe:**
✅ Vé điện tử (kỹ thuật số hoặc in)
✅ CMND/CCCD hợp lệ khớp với tên hành khách
✅ Có mặt sớm 15 phút

**Quan trọng:**
⚠️ Một vé điện tử cho mỗi hành khách
⚠️ Mã QR phải nguyên vẹn và đọc được
⚠️ Chụp màn hình được chấp nhận nếu mã QR rõ ràng`,
      keywords: ['vé điện tử', 'vé', 'mã qr', 'cách lên xe', 'xuất trình vé', 'dùng vé'],
      relatedLinks: [
        { text: 'Vé của tôi', url: '/bookings' },
        { text: 'Tra cứu vé', url: '/find-booking' },
        { text: 'Tải vé điện tử', url: '/bookings' }
      ]
    },

    booking_process: {
      question: 'Cách đặt vé?',
      answer: `📝 **Hướng dẫn đặt vé chi tiết:**

**Bước 1: Tìm chuyến**
- Nhập điểm đi
- Nhập điểm đến
- Chọn ngày khởi hành
- Chọn số hành khách
- Nhấn "Tìm kiếm"

**Bước 2: Chọn chuyến**
- Xem các chuyến có sẵn
- Lọc theo giờ, giá, loại xe
- So sánh các tùy chọn
- Nhấn "Chọn" chuyến ưa thích

**Bước 3: Chọn ghế**
- Xem sơ đồ ghế
- Chọn ghế trống (màu xanh)
- Không thể chọn ghế đã đặt (màu xám)
- Ghế bị khóa trong 10 phút

**Bước 4: Nhập thông tin hành khách**
- Họ tên đầy đủ (theo CMND)
- Số CMND/Hộ chiếu
- Số điện thoại
- Địa chỉ email

**Bước 5: Xem lại & Thanh toán**
- Xác minh tất cả thông tin
- Đọc chính sách hủy
- Chọn phương thức thanh toán
- Hoàn tất thanh toán trong 10 phút

**Bước 6: Nhận vé điện tử**
- Vé điện tử gửi ngay qua email
- Lưu hoặc in để lên xe
- Kiểm tra "Vé của tôi" bất cứ lúc nào

**Thanh toán khách:**
✅ Không cần tài khoản
✅ Dùng "Tra cứu vé" để truy cập sau
✅ Tạo tài khoản bất cứ lúc nào để quản lý vé

**Cần hỗ trợ?**
💬 Trò chuyện với tôi về hành trình
📞 Gọi 1900-xxxx
📧 Email support@busticket.com`,
      keywords: ['cách đặt vé', 'quy trình đặt vé', 'đặt vé', 'đặt chỗ', 'mua vé', 'book'],
      relatedLinks: [
        { text: 'Tìm chuyến', url: '/search' },
        { text: 'Hướng dẫn', url: '/how-it-works' }
      ]
    },

    guest_booking: {
      question: 'Có thể đặt vé mà không cần tài khoản không?',
      answer: `👤 **Đặt vé khách:**

**Có! Bạn có thể đặt vé mà không cần tài khoản**

**Tính năng thanh toán khách:**
✅ Quy trình đặt vé nhanh
✅ Không cần đăng ký
✅ Chỉ cần email và điện thoại
✅ Vé điện tử gửi ngay
✅ Vẫn có thể hủy/thay đổi

**Cách truy cập đặt vé:**
1. Dùng tính năng "Tra cứu vé"
2. Nhập số tham chiếu đặt vé (VD: BK20251115001)
3. Nhập email dùng khi đặt vé
4. Xem chi tiết, tải vé điện tử, hoặc hủy

**Lợi ích tạo tài khoản:**
- Xem tất cả vé ở một nơi
- Thanh toán nhanh hơn (lưu thông tin)
- Theo dõi lịch sử đặt vé
- Ưu đãi và khuyến mãi độc quyền
- Dễ dàng thay đổi

**Tạo tài khoản bất cứ lúc nào:**
Sau khi đặt vé khách, bạn có thể tạo tài khoản và liên kết vé tự động.

**Bảo mật:**
🔒 Dữ liệu được mã hóa và bảo mật
🔒 Không chia sẻ thông tin của bạn
🔒 Tuân thủ GDPR

**Các bước đặt vé khách:**
1. Tìm và chọn chuyến
2. Chọn ghế
3. Nhập thông tin liên lạc (không cần mật khẩu)
4. Thanh toán và nhận vé điện tử

**Tìm vé của bạn:**
📧 Số tham chiếu trong email xác nhận
📱 Lưu số tham chiếu để dễ truy cập
🔍 "Tra cứu vé" trên website`,
      keywords: ['khách', 'không tài khoản', 'không đăng ký', 'đặt vé không cần đăng nhập', 'thanh toán khách'],
      relatedLinks: [
        { text: 'Tra cứu vé', url: '/find-booking' },
        { text: 'Tìm chuyến', url: '/search' },
        { text: 'Tạo tài khoản', url: '/register' }
      ]
    },

    seat_selection: {
      question: 'Cách chọn ghế?',
      answer: `💺 **Hướng dẫn chọn ghế:**

**Màu trạng thái ghế:**
🟢 Xanh = Có sẵn (có thể chọn)
⚫ Xám = Đã đặt (đã có người)
🔵 Xanh dương = Bạn đã chọn
🔴 Đỏ = Đang bị khóa bởi người khác

**Cách chọn:**
1. Xem sơ đồ ghế sau khi chọn chuyến
2. Nhấn vào ghế trống (màu xanh)
3. Nhấn lại để bỏ chọn
4. Xác nhận để khóa ghế

**Khóa ghế:**
⏰ Ghế đã chọn bị khóa trong 10 phút
⏰ Đồng hồ hiển thị thời gian còn lại
⏰ Hoàn tất đặt vé trước khi hết giờ
⏰ Khóa được gia hạn với mỗi hành động

**Loại ghế:**
🪟 Ghế cửa sổ - Ngắm cảnh
🚶 Ghế lối đi - Dễ di chuyển
⭐ Ghế VIP - Không gian rộng (có thể tính thêm phí)
👥 Ghế tiêu chuẩn - Ghế thường

**Mẹo:**
✅ Ghế đầu - Ít rung, xuống xe đầu tiên
✅ Ghế giữa - Đi êm nhất
✅ Ghế cuối - Riêng tư hơn, gần toilet
✅ Ghế cửa sổ - Tựa đầu, ngắm cảnh
✅ Ghế lối đi - Chân rộng, dễ đi toilet

**Đặt nhiều hành khách:**
- Chọn nhiều ghế cho nhóm
- Ghế phải còn trống
- Một đặt vé cho tất cả hành khách
- Nhập thông tin cho từng người

**Không thể chọn ghế?**
❌ Đã được người khác đặt
❌ Đang bị khóa bởi người khác (đợi 10 phút)
❌ Dành cho nhu cầu đặc biệt
❌ Không phải khu vực đặt vé (tài xế, cửa, v.v.)

**Giá ghế:**
- Hầu hết ghế: Giá tiêu chuẩn
- Ghế VIP/Cao cấp: Có thể có phụ phí
- Giá hiển thị khi chọn ghế`,
      keywords: ['ghế', 'chọn ghế', 'sơ đồ ghế', 'chọn chỗ', 'khóa ghế', 'ghế nào tốt'],
      relatedLinks: [
        { text: 'Tìm chuyến', url: '/search' },
        { text: 'Hướng dẫn đặt vé', url: '/how-it-works' }
      ]
    },

    contact_support: {
      question: 'Làm sao liên hệ hỗ trợ?',
      answer: `📞 **Liên hệ hỗ trợ:**

**Dịch vụ khách hàng:**
📧 Email: support@busticket.com
📞 Hotline: 1900-xxxx (24/7)
💬 Chat trực tuyến: Có sẵn trên website
🤖 Chatbot: Tôi ở đây để giúp bạn!

**Thời gian phản hồi:**
- Chat/Chatbot: Ngay lập tức
- Hotline: Ngay lập tức
- Email: Trong vòng 24 giờ
- Mạng xã hội: Trong vòng 4 giờ

**Giờ làm việc:**
🕐 24/7 cho trường hợp khẩn cấp
🕐 8:00 - 22:00 cho câu hỏi thông thường

**Mạng xã hội:**
📘 Facebook: /BusTicketBooking
📷 Instagram: @busticketbooking
🐦 Twitter: @BusTicketBook

**Văn phòng chính:**
📍 123 Đường Nguyễn Huệ
   Quận 1, Thành phố Hồ Chí Minh
   Việt Nam

**Chúng tôi có thể hỗ trợ:**
✅ Vấn đề đặt vé
✅ Vấn đề thanh toán
✅ Hủy/Hoàn tiền
✅ Hỗ trợ kỹ thuật
✅ Câu hỏi chung
✅ Khiếu nại và phản hồi

**Trước khi liên hệ:**
Vui lòng chuẩn bị:
- Số tham chiếu đặt vé
- Email dùng khi đặt vé
- Chi tiết vấn đề
- Ảnh chụp màn hình (nếu có)

**Khẩn cấp trên xe?**
🚨 Gọi tài xế trực tiếp (số trên vé điện tử)
🚨 Gọi hotline khẩn cấp: 1900-xxxx
🚨 Dùng nút khẩn cấp trên xe

**Muốn:**
- Báo cáo vấn đề → support@busticket.com
- Gửi phản hồi → feedback@busticket.com
- Liên hệ kinh doanh → business@busticket.com`,
      keywords: ['liên hệ', 'hỗ trợ', 'giúp đỡ', 'dịch vụ khách hàng', 'số điện thoại', 'email', 'gọi', 'nói chuyện', 'người thật'],
      relatedLinks: [
        { text: 'Trang liên hệ', url: '/contact' },
        { text: 'Trung tâm trợ giúp', url: '/help' },
        { text: 'Câu hỏi thường gặp', url: '/faq' }
      ]
    }
  }
};

/**
 * Get FAQ by topic
 */
function getFAQByTopic(topic, language = 'en') {
  const lang = FAQ_KNOWLEDGE_BASE[language] || FAQ_KNOWLEDGE_BASE.en;
  return lang[topic] || null;
}

/**
 * Search FAQ by keywords
 */
function searchFAQ(query, language = 'en') {
  const lang = FAQ_KNOWLEDGE_BASE[language] || FAQ_KNOWLEDGE_BASE.en;
  const queryLower = query.toLowerCase();
  const results = [];

  Object.keys(lang).forEach(topic => {
    const faq = lang[topic];
    const matchScore = faq.keywords.reduce((score, keyword) => {
      if (queryLower.includes(keyword.toLowerCase())) {
        return score + 1;
      }
      return score;
    }, 0);

    if (matchScore > 0) {
      results.push({ ...faq, topic, matchScore });
    }
  });

  // Sort by match score (highest first)
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}

/**
 * Get all FAQ topics
 */
function getAllTopics(language = 'en') {
  const lang = FAQ_KNOWLEDGE_BASE[language] || FAQ_KNOWLEDGE_BASE.en;
  return Object.keys(lang).map(topic => ({
    topic,
    question: lang[topic].question
  }));
}

module.exports = {
  FAQ_KNOWLEDGE_BASE,
  getFAQByTopic,
  searchFAQ,
  getAllTopics
};
