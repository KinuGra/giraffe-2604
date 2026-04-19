"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface CodeViewerProps {
  code: string;
  runtime?: string;
  onSave?: (code: string) => Promise<void>;
}

export function CodeViewer({ code, runtime, onSave }: CodeViewerProps) {
  const [draft, setDraft] = useState(code);
  const [saving, setSaving] = useState(false);
  const dirty = draft !== code;

  useEffect(() => {
    setDraft(code);
  }, [code]);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col rounded-lg border bg-panel-2 overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 bg-panel">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="font-medium">index</span>
          {dirty && (
            <span className="text-[11px] text-muted-foreground">● unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">
            {runtime ?? "unknown"}
          </span>
          {onSave && (
            <Button
              size="xs"
              variant={dirty ? "default" : "outline"}
              className="gap-1 text-[11px] h-6"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save className="size-3" />
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <Textarea
        className="font-mono text-xs rounded-none border-0 focus-visible:ring-0 min-h-[320px] resize-none bg-panel-2 p-4 leading-relaxed"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
