import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Chỉ khi NODE_ENV=development: log ngắn mỗi request (định tuyến admin).
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const { pathname, search } = request.nextUrl;
    console.log(
      `[backend] ${request.method} ${pathname}${search ? search : ""}`,
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
