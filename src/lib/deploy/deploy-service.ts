import "server-only";
import type { ProjectVersion, DeployResult } from "app-types/project";
import {
  projectRepository,
  projectFileRepository,
  projectVersionRepository,
} from "@/lib/db/repository";
import logger from "logger";

export interface DeployService {
  createVersion(
    projectId: string,
    userId: string,
    changeSummary?: string,
  ): Promise<ProjectVersion>;
  deployToVercel?(projectId: string, versionId: string): Promise<DeployResult>;
  pushToGitHub?(
    projectId: string,
    versionId: string,
  ): Promise<{ success: boolean; commitSha?: string }>;
}

export const deployService: DeployService = {
  async createVersion(
    projectId: string,
    userId: string,
    changeSummary?: string,
  ): Promise<ProjectVersion> {
    try {
      // Get current project
      const project = await projectRepository.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Check ownership
      const hasAccess = await projectRepository.checkAccess(projectId, userId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Calculate next version number
      const nextVersionNumber = (project.versionCount || 0) + 1;

      // Create version record
      const version = await projectVersionRepository.create({
        projectId,
        versionNumber: nextVersionNumber,
        createdBy: userId,
        changeSummary: changeSummary || `Version ${nextVersionNumber}`,
        metadata: {},
        filesManifest: {},
      });

      // Snapshot working copy files
      const fileCount = await projectFileRepository.snapshotWorkingCopy(
        projectId,
        version.id,
      );

      logger.info("Version created with file snapshot", {
        projectId,
        versionId: version.id,
        versionNumber: nextVersionNumber,
        fileCount,
      });

      // Update project version tracking
      await projectRepository.update(projectId, {
        versionCount: nextVersionNumber,
        currentVersionNumber: nextVersionNumber,
        currentVersionId: version.id,
      });

      return version;
    } catch (error) {
      logger.error("Failed to create version", { error, projectId, userId });
      throw error;
    }
  },

  // Optional: Vercel deployment (stub for Stage 2)
  async deployToVercel(
    projectId: string,
    versionId: string,
  ): Promise<DeployResult> {
    logger.info("Vercel deployment not yet implemented", {
      projectId,
      versionId,
    });

    const version = await projectVersionRepository.findById(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    return {
      version,
      success: false,
      error: "Vercel deployment not yet implemented in Stage 2",
    };
  },

  // Optional: GitHub push (stub for Stage 2)
  async pushToGitHub(
    projectId: string,
    versionId: string,
  ): Promise<{ success: boolean; commitSha?: string }> {
    logger.info("GitHub push not yet implemented", { projectId, versionId });

    return {
      success: false,
    };
  },
};
