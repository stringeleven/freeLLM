"use client";

import { useState, useEffect } from "react";
import { HistoryIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "ui/button";
import { ScrollArea } from "ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";
import type { ProjectVersion } from "app-types/project";
import { cn } from "@/lib/utils";
import logger from "logger";

interface VersionHistoryProps {
  projectId: string;
  onVersionRestored?: () => void;
}

export function VersionHistory({
  projectId,
  onVersionRestored,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (!response.ok) {
        throw new Error("Failed to load versions");
      }
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      logger.error("Failed to load versions", { error: err, projectId });
      setError("Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const handleRestore = async (versionId: string) => {
    setIsRestoring(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to restore version");
      }

      setRestoreVersionId(null);
      onVersionRestored?.();
      await loadVersions();
    } catch (err) {
      logger.error("Failed to restore version", { error: err, versionId });
      alert("Failed to restore version. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Versions</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadVersions}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RotateCcwIcon
            className={cn("h-4 w-4", isLoading && "animate-spin")}
          />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : versions.length === 0 && !isLoading ? (
            <div className="text-muted-foreground text-sm">
              No versions yet. Deploy to create a version.
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      v{version.versionNumber}
                    </div>
                    {version.changeSummary && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {version.changeSummary}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                    {version.vercelDeploymentUrl && (
                      <a
                        href={version.vercelDeploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 block"
                      >
                        View deployment
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRestoreVersionId(version.id)}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={restoreVersionId !== null}
        onOpenChange={(open) => !open && setRestoreVersionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current working copy with this version. Any
              unsaved changes will be lost. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                restoreVersionId && handleRestore(restoreVersionId)
              }
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Restore Version"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
