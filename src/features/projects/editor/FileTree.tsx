"use client";

import { useState, useEffect } from "react";
import { FileIcon, FolderIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "ui/button";
import { ScrollArea } from "ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ProjectFileMetadata } from "app-types/project";
import { projectFilesAdapter } from "@/features/projects/editor/adapters/projectFilesAdapter";
import { FileTreeActions } from "./FileTreeActions";
import logger from "logger";

interface FileTreeProps {
  projectId: string;
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTree({
  projectId,
  selectedPath,
  onFileSelect,
}: FileTreeProps) {
  const [files, setFiles] = useState<ProjectFileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([""]),
  );

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fileList = await projectFilesAdapter.listFiles(projectId);
      setFiles(fileList);
    } catch (err) {
      logger.error("Failed to load files", { error: err, projectId });
      setError("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const buildFileTree = (files: ProjectFileMetadata[]) => {
    const tree: Record<string, any> = {};

    for (const file of files) {
      const parts = file.path.split("/");
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (!current[part]) {
          current[part] = isFile ? { _file: file } : {};
        }

        if (!isFile) {
          current = current[part];
        }
      }
    }

    return tree;
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderTree = (tree: Record<string, any>, path = "") => {
    return Object.keys(tree)
      .sort()
      .map((key) => {
        const node = tree[key];
        const fullPath = path ? `${path}/${key}` : key;
        const isFile = node._file !== undefined;
        const isExpanded = expandedFolders.has(fullPath);

        if (isFile) {
          const file = node._file as ProjectFileMetadata;
          return (
            <button
              key={fullPath}
              onClick={() => onFileSelect(fullPath)}
              className={cn(
                "flex w-full items-center gap-2 px-2 py-1 text-left text-sm hover:bg-accent rounded",
                selectedPath === fullPath && "bg-accent",
              )}
            >
              <FileIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{key}</span>
              {file.sizeBytes && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatFileSize(file.sizeBytes)}
                </span>
              )}
            </button>
          );
        }

        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className="flex w-full items-center gap-2 px-2 py-1 text-left text-sm font-medium hover:bg-accent rounded"
            >
              <FolderIcon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
              <span className="truncate">{key}</span>
            </button>
            {isExpanded && (
              <div className="ml-4">{renderTree(node, fullPath)}</div>
            )}
          </div>
        );
      });
  };

  const formatFileSize = (bytes: string | number): string => {
    const size = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
    if (isNaN(size)) return "";
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="font-semibold text-sm">Files</h3>
        <div className="flex items-center gap-1">
          <FileTreeActions projectId={projectId} onFileCreated={loadFiles} />
          <Button
            variant="ghost"
            size="sm"
            onClick={loadFiles}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCwIcon
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : files.length === 0 && !isLoading ? (
            <div className="text-muted-foreground text-sm">No files yet</div>
          ) : (
            renderTree(fileTree)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
