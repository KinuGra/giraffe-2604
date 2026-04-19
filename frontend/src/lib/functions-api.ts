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

export interface ExecutionLog {
  id: string;
  functionId: string;
  output: string;
  error: string;
  exitCode: number;
  durationMs: number;
  createdAt: string;
}

function mapFn(r: Record<string, unknown>): FunctionInfo {
  return {
    id: r.id as string,
    name: r.name as string,
    runtime: r.runtime as string,
    code: r.code as string,
    createdAt: r.created_at as string,
    timeoutSec: r.timeout_sec as number,
  };
}

function mapResult(r: Record<string, unknown>): ExecuteResult {
  return {
    output: (r.output as string) ?? "",
    error: (r.error as string) ?? "",
    exitCode: (r.exit_code as number) ?? 0,
    durationMs: (r.duration_ms as number) ?? 0,
  };
}

function mapLog(r: Record<string, unknown>): ExecutionLog {
  return {
    id: r.id as string,
    functionId: r.function_id as string,
    output: (r.output as string) ?? "",
    error: (r.error as string) ?? "",
    exitCode: (r.exit_code as number) ?? 0,
    durationMs: (r.duration_ms as number) ?? 0,
    createdAt: r.created_at as string,
  };
}

export const functionsApi = {
  list: async (): Promise<FunctionInfo[]> => {
    const res = await fetch(`${GATEWAY_URL}/functions`);
    if (!res.ok) throw new Error("Failed to fetch functions");
    const data = await res.json();
    return (data.functions ?? []).map(mapFn);
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
    return mapFn(await res.json());
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
    return mapFn(await res.json());
  },

  execute: async (
    id: string,
    opts: {
      timeoutSec?: number;
      env?: Record<string, string>;
      stdin?: string;
    } = {},
  ): Promise<ExecuteResult> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeout_sec: opts.timeoutSec ?? 0,
        env: opts.env ?? {},
        stdin: opts.stdin ?? "",
      }),
    });
    if (!res.ok) throw new Error("Failed to execute function");
    return mapResult(await res.json());
  },

  logs: async (id: string): Promise<ExecutionLog[]> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    const data = await res.json();
    return (data.logs ?? []).map(mapLog);
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete function");
  },
};
