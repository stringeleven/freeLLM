import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "app-types/project";
import { pgDb as db } from "../db.pg";
import { ProjectTable } from "../schema.pg";
import { and, desc, eq } from "drizzle-orm";
import logger from "logger";

export interface ProjectRepository {
  create(project: CreateProjectInput & { userId: string }): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  update(id: string, data: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
  checkAccess(id: string, userId: string): Promise<boolean>;
}

export const pgProjectRepository: ProjectRepository = {
  create: async (project): Promise<Project> => {
    try {
      const [result] = await db
        .insert(ProjectTable)
        .values({
          userId: project.userId,
          externalProjectId: project.externalProjectId,
          name: project.name,
          description: project.description,
          templateUsed: project.templateUsed,
        })
        .returning();

      logger.info("Project created", {
        projectId: result.id,
        userId: project.userId,
      });
      return result;
    } catch (error) {
      logger.error("Failed to create project", {
        error,
        userId: project.userId,
      });
      throw error;
    }
  },

  findById: async (id: string): Promise<Project | null> => {
    try {
      const [result] = await db
        .select()
        .from(ProjectTable)
        .where(eq(ProjectTable.id, id));

      return result || null;
    } catch (error) {
      logger.error("Failed to find project by id", { error, projectId: id });
      throw error;
    }
  },

  findByUserId: async (userId: string): Promise<Project[]> => {
    try {
      const results = await db
        .select()
        .from(ProjectTable)
        .where(eq(ProjectTable.userId, userId))
        .orderBy(desc(ProjectTable.lastActivityAt));

      return results;
    } catch (error) {
      logger.error("Failed to find projects by userId", { error, userId });
      throw error;
    }
  },

  update: async (id: string, data: UpdateProjectInput): Promise<Project> => {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.vercelPreviewUrl !== undefined)
        updateData.vercelPreviewUrl = data.vercelPreviewUrl;

      const [result] = await db
        .update(ProjectTable)
        .set(updateData)
        .where(eq(ProjectTable.id, id))
        .returning();

      logger.info("Project updated", { projectId: id });
      return result;
    } catch (error) {
      logger.error("Failed to update project", { error, projectId: id });
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await db.delete(ProjectTable).where(eq(ProjectTable.id, id));
      logger.info("Project deleted", { projectId: id });
    } catch (error) {
      logger.error("Failed to delete project", { error, projectId: id });
      throw error;
    }
  },

  checkAccess: async (id: string, userId: string): Promise<boolean> => {
    try {
      const [result] = await db
        .select({
          userId: ProjectTable.userId,
        })
        .from(ProjectTable)
        .where(and(eq(ProjectTable.id, id), eq(ProjectTable.userId, userId)));

      return Boolean(result);
    } catch (error) {
      logger.error("Failed to check project access", {
        error,
        projectId: id,
        userId,
      });
      throw error;
    }
  },
};
