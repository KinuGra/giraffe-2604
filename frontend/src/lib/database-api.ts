import { GATEWAY_URL } from "./constants";

export type { TableInfo, ColumnDef } from "./mock-data";

export interface RowsResponse {
  rows: Record<string, unknown>[];
  totalCount: number;
}

export interface SqlResponse {
  rows: Record<string, unknown>[];
  affectedRows: number;
  executionTimeMs: number;
}

export const databaseApi = {
  listTables: async (schema = "public"): Promise<
    { name: string; schema: string; rls: boolean; rowCount: number }[]
  > => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables?schema=${encodeURIComponent(schema)}`,
    );
    if (!res.ok) throw new Error("Failed to fetch tables");
    return res.json();
  },

  createTable: async (
    schema: string,
    name: string,
    columns: {
      name: string;
      type: string;
      default_value?: string;
      nullable?: boolean;
      is_primary_key?: boolean;
      is_unique?: boolean;
    }[],
  ): Promise<{ name: string; schema: string; rls: boolean; rowCount: number }> => {
    const res = await fetch(`${GATEWAY_URL}/database/v1/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema, name, columns }),
    });
    if (!res.ok) throw new Error("Failed to create table");
    return res.json();
  },

  deleteTable: async (name: string, schema = "public"): Promise<void> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(name)}?schema=${encodeURIComponent(schema)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error("Failed to delete table");
  },

  listColumns: async (
    table: string,
    schema = "public",
  ): Promise<
    {
      name: string;
      type: string;
      default: string | null;
      nullable: boolean;
      isPrimaryKey: boolean;
      isUnique: boolean;
    }[]
  > => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/columns?schema=${encodeURIComponent(schema)}`,
    );
    if (!res.ok) throw new Error("Failed to fetch columns");
    const data: {
      name: string;
      type: string;
      default: string;
      nullable: boolean;
      isPrimaryKey: boolean;
      isUnique: boolean;
    }[] = await res.json();
    return data.map((col) => ({
      ...col,
      default: col.default || null,
    }));
  },

  addColumn: async (
    table: string,
    schema: string,
    column: {
      name: string;
      type: string;
      default_value?: string;
      nullable?: boolean;
      is_primary_key?: boolean;
      is_unique?: boolean;
    },
  ): Promise<void> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/columns?schema=${encodeURIComponent(schema)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column }),
      },
    );
    if (!res.ok) throw new Error("Failed to add column");
  },

  deleteColumn: async (
    table: string,
    column: string,
    schema = "public",
  ): Promise<void> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}?schema=${encodeURIComponent(schema)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error("Failed to delete column");
  },

  getRows: async (
    table: string,
    schema = "public",
    limit = 25,
    offset = 0,
    orderBy?: string,
  ): Promise<RowsResponse> => {
    const params = new URLSearchParams({
      schema,
      limit: String(limit),
      offset: String(offset),
    });
    if (orderBy) params.set("order_by", orderBy);
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/rows?${params}`,
    );
    if (!res.ok) throw new Error("Failed to fetch rows");
    return res.json();
  },

  insertRow: async (
    table: string,
    values: Record<string, unknown>,
    schema = "public",
  ): Promise<Record<string, unknown>> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/rows?schema=${encodeURIComponent(schema)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    if (!res.ok) throw new Error("Failed to insert row");
    return res.json();
  },

  updateRow: async (
    table: string,
    pk: Record<string, unknown>,
    values: Record<string, unknown>,
    schema = "public",
  ): Promise<Record<string, unknown>> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/rows?schema=${encodeURIComponent(schema)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk, values }),
      },
    );
    if (!res.ok) throw new Error("Failed to update row");
    return res.json();
  },

  deleteRow: async (
    table: string,
    pk: Record<string, unknown>,
    schema = "public",
  ): Promise<{ affectedRows: number }> => {
    const res = await fetch(
      `${GATEWAY_URL}/database/v1/tables/${encodeURIComponent(table)}/rows?schema=${encodeURIComponent(schema)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk }),
      },
    );
    if (!res.ok) throw new Error("Failed to delete row");
    return res.json();
  },

  executeSQL: async (query: string): Promise<SqlResponse> => {
    const res = await fetch(`${GATEWAY_URL}/database/v1/sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error("Failed to execute SQL");
    return res.json();
  },
};
