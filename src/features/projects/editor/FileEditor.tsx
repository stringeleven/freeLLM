"use client";

import { useState, useEffect } from "react";
import { SaveIcon } from "lucide-react";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { cn } from "@/lib/utils";
import type { FileContent } from "app-types/project";
import { projectFilesAdapter } from "@/features/projects/editor/adapters/projectFilesAdapter";
import logger from "logger";

interface FileEditorProps {
  projectId: string;
  filePath: string | null;
  onSaveSuccess?: () => void;
}

export function FileEditor({
  projectId,
  filePath,
  onSaveSuccess,
}: FileEditorProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [mimeType, setMimeType] = useState("text/plain");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isDirty = content !== originalContent;

  useEffect(() => {
    if (!filePath) {
      setContent("");
      setOriginalContent("");
      setMimeType("text/plain");
      setError(null);
      return;
    }

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);
      try {
        const fileContent: FileContent = await projectFilesAdapter.readFile(
          projectId,
          filePath,
        );
        setContent(fileContent.content);
        setOriginalContent(fileContent.content);
        setMimeType(fileContent.mimeType || "text/plain");
      } catch (err) {
        logger.error("Failed to load file", {
          error: err,
          projectId,
          filePath,
        });
        setError("Failed to load file");
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [projectId, filePath]);

  const handleSave = async () => {
    if (!filePath) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await projectFilesAdapter.saveFile(
        projectId,
        filePath,
        content,
        mimeType,
      );
      setOriginalContent(content);
      setSaveSuccess(true);
      onSaveSuccess?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      logger.error("Failed to save file", { error: err, projectId, filePath });
      setError("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  if (!filePath) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{filePath}</h3>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(modified)</span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading}
          size="sm"
          className="gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive border-b p-2 text-sm">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 border-b p-2 text-sm">
          File saved successfully
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Loading...</p>
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={cn(
              "h-full resize-none border-0 font-mono text-sm focus-visible:ring-0",
              "rounded-none",
            )}
            placeholder="File content will appear here..."
          />
        )}
      </div>
    </div>
  );
}
