"use client";

import { useState } from "react";
import { FileTree } from "./FileTree";
import { FileEditor } from "./FileEditor";
import { ResizableLayout } from "../preview/ResizableLayout";

interface ProjectEditorProps {
  projectId: string;
  initialFilePath?: string | null;
  onFilePathChange?: (path: string | null) => void;
}

export function ProjectEditor({
  projectId,
  initialFilePath = null,
  onFilePathChange,
}: ProjectEditorProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialFilePath,
  );

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
    onFilePathChange?.(path);
  };

  return (
    <ResizableLayout
      leftPanel={
        <FileTree
          projectId={projectId}
          selectedPath={selectedPath}
          onFileSelect={handleFileSelect}
        />
      }
      rightPanel={<FileEditor projectId={projectId} filePath={selectedPath} />}
      defaultLeftWidth={25}
      minLeftWidth={15}
      maxLeftWidth={50}
    />
  );
}
