import { GATEWAY_URL } from "./constants";

export interface StorageObject {
  key: string;
  size: number;
  lastModified: number;
}

export interface StorageStat {
  bucket: string;
  key: string;
  size: number;
  lastModified: number;
  etag: string;
}

function mapObject(r: Record<string, unknown>): StorageObject {
  return {
    key: (r.key as string) ?? "",
    size: (r.size as number) ?? 0,
    lastModified: (r.lastModified as number) ?? 0,
  };
}

function mapStat(r: Record<string, unknown>): StorageStat {
  return {
    bucket: (r.bucket as string) ?? "",
    key: (r.key as string) ?? "",
    size: (r.size as number) ?? 0,
    lastModified: (r.lastModified as number) ?? 0,
    etag: (r.etag as string) ?? "",
  };
}

export const storageApi = {
  list: async (bucket: string): Promise<StorageObject[]> => {
    const res = await fetch(`${GATEWAY_URL}/storage/v1/objects/${bucket}`);
    if (!res.ok) throw new Error("Failed to list objects");
    const data = await res.json();
    return (data.objects ?? []).map(mapObject);
  },

  listBuckets: async (): Promise<string[]> => {
    const res = await fetch(`${GATEWAY_URL}/storage/v1/buckets`);
    if (!res.ok) throw new Error("Failed to list buckets");
    const data = await res.json();
    return data.buckets ?? [];
  },

  createBucket: async (bucket: string): Promise<void> => {
    const res = await fetch(`${GATEWAY_URL}/storage/v1/buckets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket }),
    });
    if (!res.ok) throw new Error("Failed to create bucket");
  },

  upload: async (
    bucket: string,
    key: string,
    file: File,
  ): Promise<{ etag: string }> => {
    const formData = new FormData();
    formData.append("bucket", bucket);
    formData.append("key", key);
    formData.append("content", file);

    const res = await fetch(`${GATEWAY_URL}/storage/v1/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload file");
    return res.json();
  },

  delete: async (bucket: string, key: string): Promise<void> => {
    const res = await fetch(`${GATEWAY_URL}/storage/v1/objects/${bucket}/${key}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete object");
  },

  stat: async (bucket: string, key: string): Promise<StorageStat> => {
    const res = await fetch(`${GATEWAY_URL}/storage/v1/stat/${bucket}/${key}`);
    if (!res.ok) throw new Error("Failed to stat object");
    return mapStat(await res.json());
  },
};