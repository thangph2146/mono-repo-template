import { Users, MessageSquare } from "lucide-react"
import { HOME_ROUTES } from "./constants"

// Dữ liệu cho HeroSection
export const HERO_DATA = {
  title: "HUB Parent - Kết nối phụ huynh và nhà trường",
  description:
    "Cổng thông tin giúp phụ huynh đồng hành cùng sinh viên HUB: cập nhật thông báo, gửi yêu cầu hỗ trợ và theo dõi các thông tin học tập được nhà trường cung cấp.",
  flipWords: ["Kết nối", "Đồng hành", "Cập nhật", "Hỗ trợ"],
  quote: '"Tâm an lòng, con vững bước - Đồng hành cùng tương lai con tại HUB"',
  backgroundImage: {
    src: "https://fileserver2.hub.edu.vn/IMAGES/2025/12/16/20251216103027-101020.png",
    alt: "Trường Đại học Ngân hàng TP.HCM",
  },
  buttons: [
    {
      href: HOME_ROUTES.signIn,
      text: "Đăng nhập ngay",
      variant: "default" as const,
      leftIcon: <Users className="size-4" />,
      responsiveText: { mobile: "Đăng nhập", desktop: "Đăng nhập ngay" },
    },
    {
      href: HOME_ROUTES.signUp,
      text: "Đăng ký thành viên",
      variant: "outline" as const,
      leftIcon: <MessageSquare className="size-4" />,
      responsiveText: { mobile: "Đăng ký", desktop: "Tạo tài khoản mới" },
    },
  ],
}
