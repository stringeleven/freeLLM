import type { ProjectFile, ProjectFileMetadata } from "app-types/project";
import { pgDb as db } from "../db.pg";
import { ProjectFileTable, ProjectTable } from "../schema.pg";
import { and, eq, isNull } from "drizzle-orm";
import logger from "logger";

export interface ProjectFileRepository {
  listFiles(projectId: string): Promise<ProjectFileMetadata[]>;
  getFile(projectId: string, path: string): Promise<ProjectFile | null>;
  upsertFile(
    file: Omit<ProjectFile, "id" | "lastModifiedAt">,
  ): Promise<ProjectFile>;
  deleteFile(projectId: string, path: string): Promise<void>;
  checkAccess(projectId: string, userId: string): Promise<boolean>;
}

export const pgProjectFileRepository: ProjectFileRepository = {
  listFiles: async (projectId: string): Promise<ProjectFileMetadata[]> => {
    try {
      const results = await db
        .select({
          id: ProjectFileTable.id,
          projectId: ProjectFileTable.projectId,
          versionId: ProjectFileTable.versionId,
          path: ProjectFileTable.path,
          mimeType: ProjectFileTable.mimeType,
          sizeBytes: ProjectFileTable.sizeBytes,
          contentHash: ProjectFileTable.contentHash,
          lastModifiedAt: ProjectFileTable.lastModifiedAt,
          isBinary: ProjectFileTable.isBinary,
        })
        .from(ProjectFileTable)
        .where(
          and(
            eq(ProjectFileTable.projectId, projectId),
            isNull(ProjectFileTable.versionId), // Only working copy files
          ),
        );

      return results;
    } catch (error) {
      logger.error("Failed to list project files", { error, projectId });
      throw error;
    }
  },

  getFile: async (
    projectId: string,
    path: string,
  ): Promise<ProjectFile | null> => {
    try {
      const [result] = await db
        .select()
        .from(ProjectFileTable)
        .where(
          and(
            eq(ProjectFileTable.projectId, projectId),
            eq(ProjectFileTable.path, path),
            isNull(ProjectFileTable.versionId), // Only working copy
          ),
        );

      return result || null;
    } catch (error) {
      logger.error("Failed to get project file", { error, projectId, path });
      throw error;
    }
  },

  upsertFile: async (
    file: Omit<ProjectFile, "id" | "lastModifiedAt">,
  ): Promise<ProjectFile> => {
    try {
      // Check if file exists
      const existing = await pgProjectFileRepository.getFile(
        file.projectId,
        file.path,
      );

      if (existing) {
        // Update existing file
        const [result] = await db
          .update(ProjectFileTable)
          .set({
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            contentHash: file.contentHash,
            blobPath: file.blobPath,
            isBinary: file.isBinary,
            lastModifiedAt: new Date(),
          })
          .where(eq(ProjectFileTable.id, existing.id))
          .returning();

        logger.info("Project file updated", {
          projectId: file.projectId,
          path: file.path,
        });
        return result;
      } else {
        // Insert new file
        const [result] = await db
          .insert(ProjectFileTable)
          .values({
            projectId: file.projectId,
            versionId: file.versionId,
            path: file.path,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            contentHash: file.contentHash,
            blobPath: file.blobPath,
            isBinary: file.isBinary,
          })
          .returning();

        logger.info("Project file created", {
          projectId: file.projectId,
          path: file.path,
        });
        return result;
      }
    } catch (error) {
      logger.error("Failed to upsert project file", {
        error,
        projectId: file.projectId,
        path: file.path,
      });
      throw error;
    }
  },

  deleteFile: async (projectId: string, path: string): Promise<void> => {
    try {
      await db
        .delete(ProjectFileTable)
        .where(
          and(
            eq(ProjectFileTable.projectId, projectId),
            eq(ProjectFileTable.path, path),
            isNull(ProjectFileTable.versionId),
          ),
        );

      logger.info("Project file deleted", { projectId, path });
    } catch (error) {
      logger.error("Failed to delete project file", { error, projectId, path });
      throw error;
    }
  },

  checkAccess: async (projectId: string, userId: string): Promise<boolean> => {
    try {
      const [result] = await db
        .select({
          userId: ProjectTable.userId,
        })
        .from(ProjectTable)
        .where(
          and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
        );

      return Boolean(result);
    } catch (error) {
      logger.error("Failed to check project file access", {
        error,
        projectId,
        userId,
      });
      throw error;
    }
  },
};
