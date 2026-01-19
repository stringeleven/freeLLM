"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { projectFilesAdapter } from "@/features/projects/editor/adapters/projectFilesAdapter";
import logger from "logger";

interface FileTreeActionsProps {
  projectId: string;
  onFileCreated?: () => void;
}

export function FileTreeActions({
  projectId,
  onFileCreated,
}: FileTreeActionsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFile = async () => {
    if (!newFilePath.trim()) return;

    setIsCreating(true);
    try {
      await projectFilesAdapter.saveFile(
        projectId,
        newFilePath,
        "",
        "text/plain",
      );
      setIsCreateDialogOpen(false);
      setNewFilePath("");
      onFileCreated?.();
    } catch (err) {
      logger.error("Failed to create file", { error: err, projectId });
      alert("Failed to create file. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCreateDialogOpen(true)}
        className="h-8 w-8 p-0"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter the file path (e.g., src/components/Button.tsx)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filepath">File Path</Label>
              <Input
                id="filepath"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="src/index.ts"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFilePath.trim()) {
                    handleCreateFile();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateFile}
              disabled={!newFilePath.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
