import type { ProjectEntity, ProjectFileEntity } from "@/lib/db/pg/schema.pg";

export type Project = ProjectEntity;

export type ProjectFile = ProjectFileEntity;

export type ProjectFileMetadata = Omit<ProjectFile, "blobPath">;

export interface FileContent {
  path: string;
  content: string;
  mimeType: string;
  isBinary: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  templateUsed?: string;
  externalProjectId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  vercelPreviewUrl?: string;
}

export interface SaveFileInput {
  path: string;
  content: string;
  mimeType?: string;
}
