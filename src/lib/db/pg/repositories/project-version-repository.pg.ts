import type {
  ProjectVersion,
  CreateVersionInput,
  ProjectFile,
} from "app-types/project";
import { pgDb as db } from "../db.pg";
import {
  ProjectVersionTable,
  ProjectTable,
  ProjectFileTable,
} from "../schema.pg";
import { and, desc, eq } from "drizzle-orm";
import logger from "logger";

export interface ProjectVersionRepository {
  create(version: CreateVersionInput): Promise<ProjectVersion>;
  findById(id: string): Promise<ProjectVersion | null>;
  findByProjectId(projectId: string): Promise<ProjectVersion[]>;
  getLatestVersion(projectId: string): Promise<ProjectVersion | null>;
  getVersionFiles(versionId: string): Promise<ProjectFile[]>;
  checkAccess(versionId: string, userId: string): Promise<boolean>;
}

export const pgProjectVersionRepository: ProjectVersionRepository = {
  create: async (version: CreateVersionInput): Promise<ProjectVersion> => {
    try {
      const [result] = await db
        .insert(ProjectVersionTable)
        .values({
          projectId: version.projectId,
          versionNumber: version.versionNumber,
          createdBy: version.createdBy,
          changeSummary: version.changeSummary,
          commitSha: version.commitSha,
          vercelDeploymentId: version.vercelDeploymentId,
          vercelDeploymentUrl: version.vercelDeploymentUrl,
          metadata: version.metadata,
          filesManifest: version.filesManifest,
        })
        .returning();

      logger.info("Project version created", {
        versionId: result.id,
        projectId: version.projectId,
        versionNumber: version.versionNumber,
      });
      return result;
    } catch (error) {
      logger.error("Failed to create project version", {
        error,
        projectId: version.projectId,
      });
      throw error;
    }
  },

  findById: async (id: string): Promise<ProjectVersion | null> => {
    try {
      const [result] = await db
        .select()
        .from(ProjectVersionTable)
        .where(eq(ProjectVersionTable.id, id));

      return result || null;
    } catch (error) {
      logger.error("Failed to find version by id", { error, versionId: id });
      throw error;
    }
  },

  findByProjectId: async (projectId: string): Promise<ProjectVersion[]> => {
    try {
      const results = await db
        .select()
        .from(ProjectVersionTable)
        .where(eq(ProjectVersionTable.projectId, projectId))
        .orderBy(desc(ProjectVersionTable.versionNumber));

      return results;
    } catch (error) {
      logger.error("Failed to find versions by projectId", {
        error,
        projectId,
      });
      throw error;
    }
  },

  getLatestVersion: async (
    projectId: string,
  ): Promise<ProjectVersion | null> => {
    try {
      const [result] = await db
        .select()
        .from(ProjectVersionTable)
        .where(eq(ProjectVersionTable.projectId, projectId))
        .orderBy(desc(ProjectVersionTable.versionNumber))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error("Failed to get latest version", { error, projectId });
      throw error;
    }
  },

  getVersionFiles: async (versionId: string): Promise<ProjectFile[]> => {
    try {
      const results = await db
        .select()
        .from(ProjectFileTable)
        .where(eq(ProjectFileTable.versionId, versionId));

      return results;
    } catch (error) {
      logger.error("Failed to get version files", { error, versionId });
      throw error;
    }
  },

  checkAccess: async (versionId: string, userId: string): Promise<boolean> => {
    try {
      const [result] = await db
        .select({
          userId: ProjectTable.userId,
        })
        .from(ProjectVersionTable)
        .innerJoin(
          ProjectTable,
          eq(ProjectVersionTable.projectId, ProjectTable.id),
        )
        .where(
          and(
            eq(ProjectVersionTable.id, versionId),
            eq(ProjectTable.userId, userId),
          ),
        );

      return Boolean(result);
    } catch (error) {
      logger.error("Failed to check version access", {
        error,
        versionId,
        userId,
      });
      throw error;
    }
  },
};
