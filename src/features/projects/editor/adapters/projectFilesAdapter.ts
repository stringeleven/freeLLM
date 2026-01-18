import type { ProjectFileMetadata, FileContent } from "app-types/project";
import logger from "logger";

export interface ProjectFilesAdapter {
  listFiles(projectId: string): Promise<ProjectFileMetadata[]>;
  readFile(projectId: string, path: string): Promise<FileContent>;
  saveFile(
    projectId: string,
    path: string,
    content: string,
    mimeType?: string,
  ): Promise<void>;
}

export const projectFilesAdapter: ProjectFilesAdapter = {
  async listFiles(projectId: string): Promise<ProjectFileMetadata[]> {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to list files");
      }

      return response.json();
    } catch (error) {
      logger.error("Adapter: Failed to list files", { error, projectId });
      throw new Error("Failed to list files. Please try again.");
    }
  },

  async readFile(projectId: string, path: string): Promise<FileContent> {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to read file");
      }

      return response.json();
    } catch (error) {
      logger.error("Adapter: Failed to read file", { error, projectId, path });
      throw new Error("Failed to read file. Please try again.");
    }
  },

  async saveFile(
    projectId: string,
    path: string,
    content: string,
    mimeType?: string,
  ): Promise<void> {
    try {
      const response = await fetch(`/api/projects/${projectId}/file`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          content,
          mimeType: mimeType || "text/plain",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save file");
      }
    } catch (error) {
      logger.error("Adapter: Failed to save file", { error, projectId, path });
      throw new Error("Failed to save file. Please try again.");
    }
  },
};
