import type { ApiClient } from "../client";
import { getData } from "./_shared";

type SchemaColumn = {
  name: string
  type: string
  kind: "pk" | "fk" | "field"
  nullable?: boolean
  references?: string
}

type SchemaTable = {
  name: string
  domain: string
  description: string
  columns: SchemaColumn[]
}

type SchemaRelation = {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  cardinality: "many-to-one" | "one-to-one" | "self"
  deleteRule?: "cascade" | "set null" | "restrict"
}

type DatabaseSchemaResponse = {
  tables: SchemaTable[]
  relations: SchemaRelation[]
}

export class SystemApi {
  constructor(private readonly http: ApiClient) {}

  async getDatabaseSchema(): Promise<DatabaseSchemaResponse> {
    return getData<DatabaseSchemaResponse>(
      this.http,
      "/admin/system/database-schema",
    );
  }
}
