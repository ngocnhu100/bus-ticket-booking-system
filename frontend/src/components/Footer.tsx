import { Bus, Facebook, Youtube } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bus className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">VeXeRe</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Cam kết hoàn 150% nếu nhà xe không cung cấp dịch vụ vận chuyển
            </p>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Giới Thiệu Vexere.com
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tin tức
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Hướng dẫn thanh toán
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Quy chế Vexere.com
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách bảo mật thông tin
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách bảo mật thanh toán
                </a>
              </li>
            </ul>
          </div>

          {/* Partner */}
          <div>
            <h4 className="font-semibold mb-4">Trở thành đối tác</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Phần mềm quản lý nhà xe
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  App quản lý nhà xe
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  App tài xế
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Payment */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Vexere.com - Bản quyền thuộc về Vexere.com
            </p>
          </div>
        </div>

        {/* Company Details */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <p>Công ty TNHH Thương Mại Dịch Vụ Vexere</p>
          <p>
            Địa chỉ đăng ký kinh doanh: 8C Chữ Đồng Tử, Phường Tân Sơn Nhất, TP.
            Hồ Chí Minh, Việt Nam
          </p>
          <p>
            Giấy chứng nhận ĐKKD số 0315133726 do Sở KH và ĐT TP. Hồ Chí Minh
            cấp lần đầu ngày 27/6/2018
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
