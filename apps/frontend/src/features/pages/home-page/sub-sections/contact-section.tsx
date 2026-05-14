"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, Phone, SendHorizonal } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Container } from "@ui/components/layout";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Field, FieldGroup, FieldLabel } from "@ui/components/field";
import { Heading, Text } from "@ui/components/typography";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface ContactSectionProps {
  className?: string;
}

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  content: string;
};

type ContactEnvelope = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: {
    id?: string;
    message?: string;
  };
};

const INITIAL_FORM: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  content: "",
};

const contactChannels = [
  {
    icon: Mail,
    label: "Email hỗ trợ",
    value: "dhnhtphcm@hub.edu.vn",
    href: "mailto:dhnhtphcm@hub.edu.vn",
  },
  {
    icon: Phone,
    label: "Hotline tuyển sinh",
    value: "0888 353 488",
    href: "tel:0888353488",
  },
  {
    icon: MapPin,
    label: "Địa chỉ",
    value: "36 Tôn Thất Đạm, Phường Sài Gòn, TP. Hồ Chí Minh",
    href: "https://hub.edu.vn",
  },
] as const;

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ContactEnvelope;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return ("data" in envelope ? envelope.data : payload) as T;
}

export const ContactSection = ({ className }: ContactSectionProps) => {
  const [formData, setFormData] = useState<ContactFormState>(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  const handleChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

  const trimmedForm = useMemo(
    () => ({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      subject: formData.subject.trim(),
      content: formData.content.trim(),
    }),
    [formData],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedForm.name || !trimmedForm.email || !trimmedForm.subject || !trimmedForm.content) {
      toast.error("Vui lòng nhập đủ họ tên, email, chủ đề và nội dung liên hệ.");
      return;
    }

    setBusy(true);
    try {
      const result = unwrapEnvelope<{ id?: string; message?: string }>(
        await api.http.post("/public/contact-requests", trimmedForm),
      );
      toast.success(result.message || "Đã gửi liên hệ hỗ trợ thành công.");
      setFormData(INITIAL_FORM);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi liên hệ hỗ trợ. Vui lòng thử lại sau.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`bg-muted/30 py-16 sm:py-20 ${className ?? ""}`}>
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} grid gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:items-start`}
      >
        <div className="space-y-6 self-center">
          <div className="space-y-3 sm:space-y-4">
            <Heading as="h3" className="text-lg sm:text-xl md:text-2xl">
              Liên hệ hỗ trợ HUB
            </Heading>
            <Text variant="muted" className="text-sm sm:text-base">
              Gửi yêu cầu trực tiếp vào hệ thống để bộ phận phụ trách tiếp nhận,
              phân công xử lý và phản hồi đúng nội dung bạn cần hỗ trợ.
            </Text>
          </div>


          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {contactChannels.map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/90 p-4 shadow-sm transition-colors hover:bg-background"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        <Card className="rounded-lg border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Liên hệ hỗ trợ</CardTitle>
            <CardDescription>
              Thông tin được ghi nhận trực tiếp vào hệ thống `contact_requests`
              để nhà trường theo dõi và xử lý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contact-name">Họ và tên</FieldLabel>
                    <Input
                      id="contact-name"
                      value={formData.name}
                      onChange={handleChange("name")}
                      placeholder="Nhập họ và tên"
                      disabled={busy}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contact-phone">Số điện thoại</FieldLabel>
                    <Input
                      id="contact-phone"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="Nhập số điện thoại (không bắt buộc)"
                      inputMode="tel"
                      disabled={busy}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange("email")}
                      placeholder="Nhập địa chỉ email"
                      disabled={busy}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contact-subject">Chủ đề</FieldLabel>
                    <Input
                      id="contact-subject"
                      value={formData.subject}
                      onChange={handleChange("subject")}
                      placeholder="Ví dụ: Cần hỗ trợ đăng nhập phụ huynh"
                      disabled={busy}
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="contact-content">Nội dung liên hệ</FieldLabel>
                  <Textarea
                    id="contact-content"
                    value={formData.content}
                    onChange={handleChange("content")}
                    placeholder="Mô tả chi tiết nội dung cần hỗ trợ để nhà trường xử lý nhanh hơn"
                    className="min-h-32"
                    disabled={busy}
                    required
                  />
                </Field>
              </FieldGroup>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Text variant="small" className="text-muted-foreground">
                  Sau khi gửi, yêu cầu sẽ xuất hiện trong hệ thống quản lý liên hệ
                  hỗ trợ của nhà trường.
                </Text>
                <Button
                  type="submit"
                  className="w-full rounded-lg gap-2 sm:w-auto"
                  disabled={busy}
                >
                  <SendHorizonal className="h-4 w-4" />
                  {busy ? "Đang gửi..." : "Gửi liên hệ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
};
