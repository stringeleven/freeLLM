import type {
  ProjectEntity,
  ProjectFileEntity,
  ProjectVersionEntity,
  ProjectChatOriginEntity,
} from "@/lib/db/pg/schema.pg";

export type Project = ProjectEntity;

export type ProjectFile = ProjectFileEntity;

export type ProjectVersion = ProjectVersionEntity;

export type ProjectChatOrigin = ProjectChatOriginEntity;

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
  versionCount?: number;
  currentVersionNumber?: number;
  currentVersionId?: string;
}

export interface SaveFileInput {
  path: string;
  content: string;
  mimeType?: string;
}

export interface CreateVersionInput {
  projectId: string;
  versionNumber: number;
  createdBy: string;
  changeSummary?: string;
  commitSha?: string;
  vercelDeploymentId?: string;
  vercelDeploymentUrl?: string;
  metadata?: Record<string, unknown>;
  filesManifest?: Record<string, unknown>;
}

export interface DeployResult {
  version: ProjectVersion;
  deploymentUrl?: string;
  success: boolean;
  error?: string;
}
