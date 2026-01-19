"use client";

import { useState, useEffect, useCallback } from "react";
import { SaveIcon } from "lucide-react";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { cn } from "@/lib/utils";
import type { FileContent } from "app-types/project";
import { projectFilesAdapter } from "@/features/projects/editor/adapters/projectFilesAdapter";
import logger from "logger";

// Helper function to detect language from file path
function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
  };
  return languageMap[ext || ""] || "text";
}

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
  const [language, setLanguage] = useState("text");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);

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
        setLanguage(detectLanguage(filePath));
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

  const handleSave = useCallback(
    async (isAuto = false) => {
      if (!filePath) return;

      if (isAuto) {
        setIsAutosaving(true);
      } else {
        setIsSaving(true);
      }
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
        setLastSaved(new Date());
        if (!isAuto) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
        onSaveSuccess?.();
      } catch (err) {
        logger.error("Failed to save file", {
          error: err,
          projectId,
          filePath,
        });
        setError("Failed to save file");
      } finally {
        if (isAuto) {
          setIsAutosaving(false);
        } else {
          setIsSaving(false);
        }
      }
    },
    [filePath, projectId, content, mimeType, onSaveSuccess],
  );

  // Autosave with debouncing (2 seconds)
  useEffect(() => {
    if (!isDirty || !filePath) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, isDirty, filePath, handleSave]);

  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isSaving) {
          handleSave(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isSaving, handleSave]);

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
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isAutosaving
              ? "Autosaving..."
              : isDirty
                ? "Unsaved changes"
                : lastSaved
                  ? `Saved at ${lastSaved.toLocaleTimeString()}`
                  : "Saved"}
          </span>
          <Button
            onClick={() => handleSave(false)}
            disabled={!isDirty || isSaving || isLoading}
            size="sm"
            className="gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
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
              "rounded-none leading-relaxed",
            )}
            placeholder="File content will appear here..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        )}
      </div>
    </div>
  );
}
