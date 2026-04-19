import { GATEWAY_URL } from "./constants";

export interface FunctionInfo {
  id: string;
  name: string;
  runtime: string;
  code: string;
  createdAt: string;
  timeoutSec: number;
}

export interface ExecuteResult {
  output: string;
  error: string;
  exitCode: number;
  durationMs: number;
}

export const functionsApi = {
  list: async (): Promise<FunctionInfo[]> => {
    const res = await fetch(`${GATEWAY_URL}/functions`);
    if (!res.ok) throw new Error("Failed to fetch functions");
    const data = await res.json();
    return (data.functions ?? []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      name: f.name as string,
      runtime: f.runtime as string,
      code: f.code as string,
      createdAt: (f.created_at ?? "") as string,
      timeoutSec: (f.timeout_sec ?? 30) as number,
    }));
  },

  create: async (
    name: string,
    runtime: string,
    code: string,
    timeoutSec = 30,
  ): Promise<FunctionInfo> => {
    const res = await fetch(`${GATEWAY_URL}/functions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, runtime, code, timeout_sec: timeoutSec }),
    });
    if (!res.ok) throw new Error("Failed to create function");
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      runtime: data.runtime,
      code: data.code,
      createdAt: data.created_at ?? "",
      timeoutSec: data.timeout_sec ?? 30,
    };
  },

  update: async (
    id: string,
    fields: { name?: string; code?: string; timeoutSec?: number },
  ): Promise<FunctionInfo> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fields.name ?? "",
        code: fields.code ?? "",
        timeout_sec: fields.timeoutSec ?? 0,
      }),
    });
    if (!res.ok) throw new Error("Failed to update function");
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      runtime: data.runtime,
      code: data.code,
      createdAt: data.created_at ?? "",
      timeoutSec: data.timeout_sec ?? 30,
    };
  },

  execute: async (id: string, timeoutSec = 0): Promise<ExecuteResult> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeout_sec: timeoutSec }),
    });
    if (!res.ok) throw new Error("Failed to execute function");
    const data = await res.json();
    return {
      output: data.output ?? "",
      error: data.error ?? "",
      exitCode: data.exit_code ?? 0,
      durationMs: data.duration_ms ?? 0,
    };
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete function");
  },
};
