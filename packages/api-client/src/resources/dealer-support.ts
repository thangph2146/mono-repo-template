import type { DealerSupportPublicPayload } from "@workspace/dealer-support";
import type { ApiClient } from "../client";

export type DealerSupportAdminPayload = {
  defaults: DealerSupportPublicPayload;
  overrides: Record<string, unknown>;
  merged: DealerSupportPublicPayload;
};

export class DealerSupportApi {
  constructor(private readonly http: ApiClient) {}

  /** GET /public/dealer-support — không cần auth. */
  publicPayload(): Promise<DealerSupportPublicPayload> {
    return this.http.get<DealerSupportPublicPayload>("/public/dealer-support");
  }

  adminGet(): Promise<DealerSupportAdminPayload> {
    return this.http.get<DealerSupportAdminPayload>("/admin/dealer-support");
  }

  adminPut(merged: DealerSupportPublicPayload): Promise<DealerSupportPublicPayload> {
    return this.http.put<DealerSupportPublicPayload>(
      "/admin/dealer-support",
      merged,
    );
  }

  adminReset(): Promise<DealerSupportPublicPayload> {
    return this.http.post<DealerSupportPublicPayload>(
      "/admin/dealer-support/reset",
    );
  }
}

export type { DealerSupportPublicPayload } from "@workspace/dealer-support";
