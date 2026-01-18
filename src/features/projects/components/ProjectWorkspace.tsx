"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectEditor } from "../editor/ProjectEditor";
import { PreviewPanel } from "../preview/PreviewPanel";
import { ResizableLayout } from "../preview/ResizableLayout";
import type { Project } from "app-types/project";
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
    <div className="h-screen">
      <ResizableLayout
        leftPanel={
          <ProjectEditor
            projectId={projectId}
            initialFilePath={selectedFile}
            onFilePathChange={handleFilePathChange}
          />
        }
        rightPanel={
          <PreviewPanel
            project={project}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
          />
        }
        defaultLeftWidth={50}
        minLeftWidth={30}
        maxLeftWidth={70}
      />
    </div>
  );
}
