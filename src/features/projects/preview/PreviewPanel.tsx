"use client";

import { Maximize, Minimize, Monitor, RefreshCw } from "lucide-react";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "./WebPreview";
import { cn } from "@/lib/utils";
import type { Project } from "app-types/project";

interface PreviewPanelProps {
  project: Project | null;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  refreshKey: number;
  setRefreshKey: (key: number | ((prev: number) => number)) => void;
}

export function PreviewPanel({
  project,
  isFullscreen,
  setIsFullscreen,
  refreshKey,
  setRefreshKey,
}: PreviewPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-black" : "flex-1",
      )}
    >
      <WebPreview
        defaultUrl={project?.vercelPreviewUrl || ""}
        onUrlChange={(url) => {
          console.log("Preview URL changed:", url);
        }}
      >
        <WebPreviewNavigation>
          <WebPreviewNavigationButton
            onClick={() => {
              setRefreshKey((prev) => prev + 1);
            }}
            tooltip="Refresh preview"
            disabled={!project?.vercelPreviewUrl}
          >
            <RefreshCw className="h-4 w-4" />
          </WebPreviewNavigationButton>
          <WebPreviewUrl
            readOnly
            placeholder="Your app will appear here..."
            value={project?.vercelPreviewUrl || ""}
          />
          <WebPreviewNavigationButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            tooltip={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            disabled={!project?.vercelPreviewUrl}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>
        {project?.vercelPreviewUrl ? (
          <WebPreviewBody key={refreshKey} src={project.vercelPreviewUrl} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-black">
            <div className="text-center text-border dark:text-input">
              <div className="mb-2">
                <Monitor className="mx-auto h-12 w-12 stroke-border text-border dark:stroke-input dark:text-input" />
              </div>
              <p className="font-medium text-sm">No preview available</p>
              <p className="text-xs">Set a preview URL to see your app here</p>
            </div>
          </div>
        )}
      </WebPreview>
    </div>
  );
}
