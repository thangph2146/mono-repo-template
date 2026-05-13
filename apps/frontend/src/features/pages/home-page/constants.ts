import { getAdminLoginUrl, getAdminRegisterUrl } from "@/features/auth/admin-bridge";

export const HOME_ROUTES = {
  signIn: getAdminLoginUrl(),
  signUp: getAdminRegisterUrl(),
  help: "/huong-dan-su-dung",
  aboutHub: "/ve-chung-toi",
  posts: "/bai-viet",
  contact: "/lien-he",
} as const;
