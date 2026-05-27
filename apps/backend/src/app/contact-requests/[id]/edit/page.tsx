"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useContactForm } from "../../_component/_hooks/use-contact-form";
import { ContactFormShell } from "../../_component/_form/contact-form-shell";
import { useContactRequestDetail } from "@/hooks/queries";
import { useUpdateContactRequest } from "../../_component/_query/use-contact-queries";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@ui/components/button";
import type { UpdateContactRequestInput } from "@workspace/api-client";

function EditContactRequestPageInner() {
  const params = useParams();
  const router = useRouter();
  const updateMutation = useUpdateContactRequest();
  const { form, resetForm, populateForm, getPayload } = useContactForm({ mode: "edit" });

  const contactId = params.id as string;

  const contactQuery = useContactRequestDetail(contactId);
  const contact = contactQuery.data;

  // Populate form when contact data is loaded
  useEffect(() => {
    if (contact) {
      // Parse structured content
      const content = contact.content || contact.message || "";
      const lines = content.split('\n').filter(line => line.trim());
      const parsed: Record<string, string> = {};

      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          parsed[key.trim()] = value.trim();
        }
      }

      populateForm({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        subject: contact.subject,
        address: parsed["Địa chỉ"] || "",
        program: parsed["Chương trình"] || "",
        major: parsed["Ngành"] || "",
        receiveInfo: parsed["Đăng ký nhận thông tin tuyển sinh"] === "Có",
        requestConsultation: parsed["Đăng ký tư vấn"] === "Có",
        message: parsed["Nội dung"] || "",
      });
    }
  }, [contact, populateForm]);

  const handleSubmit = async () => {
    if (!contact) return;
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const payload = getPayload();
    try {
      await updateMutation.mutateAsync({ id: contactId, input: payload as UpdateContactRequestInput });
      router.push(`/contact-requests/${contactId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    resetForm();
    router.push(`/contact-requests/${contactId}`);
  };

  if (contactQuery.isLoading || !contact) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.push(`/contact-requests/${contactId}`)}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại
          </Button>
        </div>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push(`/contact-requests/${contactId}`)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại
        </Button>
      </div>
      <ContactFormShell
        mode="edit"
        form={form}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={updateMutation.isPending}
      />
    </PageSection>
  );
}

export default function EditContactRequestPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <EditContactRequestPageInner />
    </AdminPageGuard>
  );
}
