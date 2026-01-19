"use client";

import { useState } from "react";
import { RocketIcon, LoaderIcon } from "lucide-react";
import { Button } from "ui/button";
import { DeployDialog } from "./DeployDialog";
import type { ProjectVersion } from "app-types/project";

interface DeployButtonProps {
  projectId: string;
  onDeploySuccess?: (version: ProjectVersion) => void;
}

export function DeployButton({
  projectId,
  onDeploySuccess,
}: DeployButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async (changeSummary?: string) => {
    setIsDeploying(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to deploy");
      }

      const result = await response.json();
      setIsDialogOpen(false);
      onDeploySuccess?.(result.version);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deploy");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isDeploying}
        className="gap-2"
      >
        {isDeploying ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <RocketIcon className="h-4 w-4" />
        )}
        {isDeploying ? "Deploying..." : "Deploy"}
      </Button>

      <DeployDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />
    </>
  );
}
