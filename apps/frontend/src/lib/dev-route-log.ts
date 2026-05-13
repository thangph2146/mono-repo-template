import { headers } from "next/headers";

type RouteLogMeta = {
  pathname: string;
  label?: string;
};

export async function logDevRouteHit({ pathname, label }: RouteLogMeta) {
  if (process.env.NODE_ENV !== "development") return;

  const headerStore = await headers();
  const referer = headerStore.get("referer") ?? "-";
  const userAgent = headerStore.get("user-agent") ?? "-";

  console.log(
    `[frontend][route] ${pathname} | ${label ?? "page"} | referer=${referer} | ua=${userAgent}`,
  );
}
