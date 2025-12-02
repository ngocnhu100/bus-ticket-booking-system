import { Bus, Phone, HelpCircle, Globe, LogIn } from 'lucide-react'
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Bus className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">VeXeRe</h1>
              <p className="text-xs opacity-90">Cam kết hoàn 150% (*)</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="hover:opacity-80 transition-opacity">
              Đơn hàng của tôi
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              Mở bán vé trên VeXeRe
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              Trở thành đối tác
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Phone className="h-4 w-4" />
              Hotline 24/7
            </Button>
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
