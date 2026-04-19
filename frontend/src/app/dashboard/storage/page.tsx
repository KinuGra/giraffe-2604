"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GATEWAY_URL } from "@/lib/constants";
import { storageApi, StorageObject } from "@/lib/storage-api";
import { FileIcon, FolderIcon, MoreHorizontal, Plus, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes === 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoragePage() {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [bucket, setBucket] = useState("default");
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBucketName, setNewBucketName] = useState("");
  const [bucketDialogOpen, setBucketDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBuckets() {
      try {
        const data = await storageApi.listBuckets();
        setBuckets(data.length > 0 ? data : ["default"]);
        if (!data.includes(bucket)) {
          setBucket(data.length > 0 ? data[0] : "default");
        }
      } catch {
        setBuckets(["default"]);
      }
    }
    loadBuckets();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await storageApi.list(bucket);
        setObjects(data);
      } catch (e) {
        setError((e as Error).message);
        setObjects([]);
      } finally {
        setLoading(false);
      }
    }
    if (bucket) {
      load();
    }
  }, [bucket]);

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return;
    try {
      await storageApi.createBucket(newBucketName.trim());
      setBuckets([...buckets, newBucketName.trim()]);
      setBucket(newBucketName.trim());
      setNewBucketName("");
      setBucketDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await storageApi.upload(bucket, file.name, file);
      const data = await storageApi.list(bucket);
      setObjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await storageApi.delete(bucket, key);
      const data = await storageApi.list(bucket);
      setObjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (key: string) => {
    window.open(`${GATEWAY_URL}/storage/v1/download/${bucket}/${key}`, "_blank");
  };

  const totalSize = objects.reduce((sum, o) => sum + o.size, 0);
  const usedGB = 1;
  const usedPercent = (totalSize / (usedGB * 1024 * 1024 * 1024)) * 100;

  return (
    <div className="mx-auto max-w-[1280px] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your project's files and buckets
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center gap-2 rounded-md border bg-background text-sm hover:bg-accent transition-colors">
              <FolderIcon className="h-4 w-4" />
              {bucket}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {buckets.map((b) => (
                <DropdownMenuItem key={b} onClick={() => setBucket(b)}>
                  {b}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <Button size="sm" onClick={() => setBucketDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Bucket
          </Button>
          <Dialog open={bucketDialogOpen} onOpenChange={setBucketDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bucket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="bucket name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBucket()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBucketDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBucket}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* File list */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-normal">Objects in {bucket}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {/* Table header */}
            <div className="flex items-center h-9 px-4 text-xs font-medium text-muted-foreground border-b bg-muted/30">
              <div className="flex-1 min-w-0">Key</div>
              <div className="w-24">Size</div>
              <div className="w-36">Last modified</div>
              <div className="w-10" />
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center h-32 text-sm text-muted-foreground justify-center">
                Loading...
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="flex items-center h-32 text-sm text-destructive justify-center">
                {error}
              </div>
            )}

            {/* Table rows */}
            {!loading && !error && objects.length === 0 && (
              <div className="flex items-center h-32 text-sm text-muted-foreground justify-center">
                No objects in this bucket
              </div>
            )}

            {!loading &&
              !error &&
              objects.map((obj) => (
                <div
                  key={obj.key}
                  className="flex items-center h-12 px-4 text-sm border-b last:border-0 hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{obj.key}</span>
                  </div>
                  <div className="w-24 text-muted-foreground">
                    {formatSize(obj.size)}
                  </div>
                  <div className="w-36 text-muted-foreground text-xs">
                    {formatDate(obj.lastModified)}
                  </div>
                  <div className="w-10 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(obj.key)}>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(obj.key)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-normal">Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage used</span>
              <span>
                {formatSize(totalSize)} / {usedGB} GB
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}