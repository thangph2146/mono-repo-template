import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Building2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Separator } from "@ui/components/separator";
import { Logo } from "../icons/logo";

const campuses = [
  {
    name: "Trụ sở chính",
    address: "36 Tôn Thất Đạm, Phường Sài Gòn, TP. Hồ Chí Minh",
  },
  {
    name: "Cơ sở Hàm Nghi",
    address: "39 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh",
  },
  {
    name: "Cơ sở Hoàng Diệu",
    address: "56 Hoàng Diệu 2, Phường Thủ Đức, TP. Hồ Chí Minh",
  },
] as const;

const contactItems = [
  {
    label: "Email",
    value: "dhnhtphcm@hub.edu.vn",
    href: "mailto:dhnhtphcm@hub.edu.vn",
    icon: Mail,
  },
  {
    label: "Tuyển sinh",
    value: "0888 353 488",
    href: "tel:0888353488",
    icon: Phone,
  },
  {
    label: "Đào tạo",
    value: "(028) 38 212 430",
    href: "tel:02838212430",
    icon: Phone,
  },
] as const;

const quickLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
] as const;

type ResourceLink = {
  href: string;
  label: string;
  external?: boolean;
};

const resourceLinks: ResourceLink[] = [
  { href: "/huong-dan-su-dung", label: "Hướng dẫn sử dụng" },
  { href: "/lien-he", label: "Liên hệ hỗ trợ" },
  { href: "", label: "Đăng nhập hệ thống" },
  { href: "https://hub.edu.vn", label: "Website HUB", external: true },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-primary/20 bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 md:px-12 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div className="space-y-6">
            <div className="w-full rounded-lg border border-white/15 bg-white p-3 shadow-lg backdrop-blur-sm sm:w-fit">
              <Link href="/" className="flex items-center gap-3">
                <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Trường Đại học Ngân hàng
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Thành phố Hồ Chí Minh
                  </p>
                </div>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-white/90" />
                <h3 className="text-base font-bold text-white">Cơ sở đào tạo</h3>
              </div>
              <div className="space-y-4">
                {campuses.map((campus) => (
                  <div key={campus.name} className="space-y-1">
                    <p className="text-sm font-semibold text-white">{campus.name}</p>
                    <div className="flex items-start gap-3 text-white/80">
                      <MapPin className="mt-0.5 size-4 shrink-0" />
                      <p className="text-sm leading-relaxed">{campus.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-white/90" />
                <h3 className="text-base font-bold text-white">Liên hệ</h3>
              </div>
              <div className="space-y-3">
                {contactItems.map(({ label, value, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="size-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-sm text-white/75">{value}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Kết nối</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://hub.edu.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/15"
                >
                  <BookOpenText className="size-4" />
                  Website HUB
                  <ExternalLink className="size-3.5" />
                </Link>
                <Link
                  href="/lien-he"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/15"
                >
                  <Mail className="size-4" />
                  Gửi liên hệ hỗ trợ
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Liên kết nhanh</h3>
              <nav className="space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={link.href === "/bai-viet" ? false : undefined}
                    className="flex items-center gap-2 text-sm text-white/85 transition-colors hover:text-white"
                  >
                    <ArrowRight className="size-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Tài nguyên</h3>
              <nav className="space-y-3">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex items-center gap-2 text-sm text-white/85 transition-colors hover:text-white"
                  >
                    <ArrowRight className="size-4" />
                    {link.label}
                    {link.external ? <ExternalLink className="size-3.5" /> : null}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-white/15" />

        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="text-sm text-white/80">
            © {currentYear} Hệ thống Kết nối Phụ huynh HUB. Được phát triển bởi Trường Đại học
            Ngân hàng TP. Hồ Chí Minh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80 md:justify-end">
            <Link href="/ve-chung-toi" className="transition-colors hover:text-white">
              Về chúng tôi
            </Link>
            <span className="text-white/35">•</span>
            <Link href="/lien-he" className="transition-colors hover:text-white">
              Liên hệ
            </Link>
            <span className="text-white/35">•</span>
            <Link href="/huong-dan-su-dung" className="inline-flex items-center gap-1 transition-colors hover:text-white">
              Trợ giúp
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
