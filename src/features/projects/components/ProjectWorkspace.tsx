"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "ui/button";
import { ProjectEditor } from "../editor/ProjectEditor";
import { PreviewPanel } from "../preview/PreviewPanel";
import { ResizableLayout } from "../preview/ResizableLayout";
import { VersionHistory } from "../versions/VersionHistory";
import { DeployButton } from "../deploy/DeployButton";
import type { Project, ProjectVersion } from "app-types/project";
import logger from "logger";

interface ProjectWorkspaceProps {
  projectId: string;
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showVersions, setShowVersions] = useState(false);
  const [versionRefreshKey, setVersionRefreshKey] = useState(0);

  const selectedFile = searchParams.get("file");

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found");
        }
        if (response.status === 403) {
          throw new Error("You don't have access to this project");
        }
        throw new Error("Failed to load project");
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      logger.error("Failed to load project", { error: err, projectId });
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleFilePathChange = (path: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (path) {
      params.set("file", path);
    } else {
      params.delete("file");
    }
    router.push(`/projects/${projectId}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleDeploySuccess = (version: ProjectVersion) => {
    setVersionRefreshKey((prev) => prev + 1);
    if (version.vercelDeploymentUrl) {
      setRefreshKey((prev) => prev + 1);
      loadProject();
    }
  };

  const handleVersionRestored = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.push("/projects")}
            className="text-primary underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between border-b p-2 bg-background">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{project?.name}</h2>
          {project?.status && (
            <span className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded">
              {project.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersions(!showVersions)}
          >
            {showVersions ? "Hide" : "Show"} Versions
          </Button>
          <DeployButton
            projectId={projectId}
            onDeploySuccess={handleDeploySuccess}
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ResizableLayout
          leftPanel={
            <ProjectEditor
              projectId={projectId}
              initialFilePath={selectedFile}
              onFilePathChange={handleFilePathChange}
            />
          }
          rightPanel={
            showVersions ? (
              <div className="flex h-full">
                <div className="flex-1">
                  <PreviewPanel
                    project={project}
                    isFullscreen={isFullscreen}
                    setIsFullscreen={setIsFullscreen}
                    refreshKey={refreshKey}
                    setRefreshKey={setRefreshKey}
                  />
                </div>
                <div className="w-80">
                  <VersionHistory
                    key={versionRefreshKey}
                    projectId={projectId}
                    onVersionRestored={handleVersionRestored}
                  />
                </div>
              </div>
            ) : (
              <PreviewPanel
                project={project}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                refreshKey={refreshKey}
                setRefreshKey={setRefreshKey}
              />
            )
          }
          defaultLeftWidth={50}
          minLeftWidth={30}
          maxLeftWidth={70}
        />
      </div>
    </div>
  );
}
