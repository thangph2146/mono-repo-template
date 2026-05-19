import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CreateContactRequestInput, UpdateContactRequestInput } from "@workspace/api-client";

export const contactFormSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Tiêu đề không được để trống"),
  address: z.string().optional(),
  program: z.string().optional(),
  major: z.string().optional(),
  receiveInfo: z.boolean().optional(),
  requestConsultation: z.boolean().optional(),
  message: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

interface UseContactFormOptions {
  defaultValues?: Partial<ContactFormData>;
  mode?: "create" | "edit";
}

export function useContactForm(options: UseContactFormOptions = {}): {
  form: UseFormReturn<ContactFormData>;
  resetForm: () => void;
  populateForm: (data: Partial<ContactFormData>) => void;
  getPayload: () => CreateContactRequestInput | UpdateContactRequestInput;
} {
  const { defaultValues, mode = "create" } = options;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      subject: defaultValues?.subject || "",
      address: defaultValues?.address || "",
      program: defaultValues?.program || "",
      major: defaultValues?.major || "",
      receiveInfo: defaultValues?.receiveInfo || false,
      requestConsultation: defaultValues?.requestConsultation || false,
      message: defaultValues?.message || "",
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      subject: "",
      address: "",
      program: "",
      major: "",
      receiveInfo: false,
      requestConsultation: false,
      message: "",
    });
  };

  const populateForm = (data: Partial<ContactFormData>) => {
    form.reset({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      subject: data.subject || "",
      address: data.address || "",
      program: data.program || "",
      major: data.major || "",
      receiveInfo: data.receiveInfo || false,
      requestConsultation: data.requestConsultation || false,
      message: data.message || "",
    });
  };

  const getPayload = (): CreateContactRequestInput | UpdateContactRequestInput => {
    const values = form.getValues();
    
    // Build structured content string from fields
    const contentParts: string[] = [];
    if (values.address) contentParts.push(`Địa chỉ: ${values.address}`);
    if (values.program) contentParts.push(`Chương trình: ${values.program}`);
    if (values.major) contentParts.push(`Ngành: ${values.major}`);
    if (values.receiveInfo !== undefined) contentParts.push(`Đăng ký nhận thông tin tuyển sinh: ${values.receiveInfo ? 'Có' : 'Không'}`);
    if (values.requestConsultation !== undefined) contentParts.push(`Đăng ký tư vấn: ${values.requestConsultation ? 'Có' : 'Không'}`);
    if (values.message) contentParts.push(`Nội dung: ${values.message}`);
    
    const content = contentParts.join('\n');
    
    if (mode === "create") {
      return {
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: values.subject,
        message: content,
      } as CreateContactRequestInput;
    }
    return {
      name: values.name,
      email: values.email,
      phone: values.phone,
      subject: values.subject,
      message: content,
    } as UpdateContactRequestInput;
  };

  return {
    form,
    resetForm,
    populateForm,
    getPayload,
  };
}
