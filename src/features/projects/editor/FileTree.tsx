"use client";

import { useState, useEffect } from "react";
import { FileIcon, FolderIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "ui/button";
import { ScrollArea } from "ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ProjectFileMetadata } from "app-types/project";
import { projectFilesAdapter } from "@/features/projects/editor/adapters/projectFilesAdapter";
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

  const renderTree = (tree: Record<string, any>, path = "") => {
    return Object.keys(tree)
      .sort()
      .map((key) => {
        const node = tree[key];
        const fullPath = path ? `${path}/${key}` : key;
        const isFile = node._file !== undefined;

        if (isFile) {
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
            </button>
          );
        }

        return (
          <div key={fullPath} className="ml-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium">
              <FolderIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{key}</span>
            </div>
            <div className="ml-2">{renderTree(node, fullPath)}</div>
          </div>
        );
      });
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="font-semibold text-sm">Files</h3>
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
