import { describe, it, expect, vi, beforeEach } from "vitest";
import { deployService } from "./deploy-service";

// Mock repositories
vi.mock("@/lib/db/repository", () => ({
  projectRepository: {
    findById: vi.fn(),
    checkAccess: vi.fn(),
    update: vi.fn(),
  },
  projectFileRepository: {
    snapshotWorkingCopy: vi.fn(),
  },
  projectVersionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Deploy Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVersion", () => {
    it("should create version and snapshot files", async () => {
      const {
        projectRepository,
        projectFileRepository,
        projectVersionRepository,
      } = await import("@/lib/db/repository");

      const mockProject = {
        id: "project-123",
        userId: "user-123",
        versionCount: 0,
      };

      const mockVersion = {
        id: "version-123",
        projectId: "project-123",
        versionNumber: 1,
      };

      (projectRepository.findById as any).mockResolvedValue(mockProject);
      (projectRepository.checkAccess as any).mockResolvedValue(true);
      (projectVersionRepository.create as any).mockResolvedValue(mockVersion);
      (projectFileRepository.snapshotWorkingCopy as any).mockResolvedValue(5);
      (projectRepository.update as any).mockResolvedValue({
        ...mockProject,
        versionCount: 1,
      });

      const version = await deployService.createVersion(
        "project-123",
        "user-123",
        "Test version",
      );

      expect(version.versionNumber).toBe(1);
      expect(projectFileRepository.snapshotWorkingCopy).toHaveBeenCalledWith(
        "project-123",
        "version-123",
      );
      expect(projectRepository.update).toHaveBeenCalledWith("project-123", {
        versionCount: 1,
        currentVersionNumber: 1,
        currentVersionId: "version-123",
      });
    });

    it("should increment version number correctly", async () => {
      const {
        projectRepository,
        projectFileRepository,
        projectVersionRepository,
      } = await import("@/lib/db/repository");

      const mockProject = {
        id: "project-123",
        userId: "user-123",
        versionCount: 5,
      };

      const mockVersion = {
        id: "version-456",
        projectId: "project-123",
        versionNumber: 6,
      };

      (projectRepository.findById as any).mockResolvedValue(mockProject);
      (projectRepository.checkAccess as any).mockResolvedValue(true);
      (projectVersionRepository.create as any).mockResolvedValue(mockVersion);
      (projectFileRepository.snapshotWorkingCopy as any).mockResolvedValue(3);
      (projectRepository.update as any).mockResolvedValue({
        ...mockProject,
        versionCount: 6,
      });

      const version = await deployService.createVersion(
        "project-123",
        "user-123",
      );

      expect(version.versionNumber).toBe(6);
    });

    it("should throw error when project not found", async () => {
      const { projectRepository } = await import("@/lib/db/repository");

      (projectRepository.findById as any).mockResolvedValue(null);

      await expect(
        deployService.createVersion("nonexistent", "user-123"),
      ).rejects.toThrow("Project not found");
    });

    it("should throw error when access denied", async () => {
      const { projectRepository } = await import("@/lib/db/repository");

      const mockProject = {
        id: "project-123",
        userId: "user-123",
      };

      (projectRepository.findById as any).mockResolvedValue(mockProject);
      (projectRepository.checkAccess as any).mockResolvedValue(false);

      await expect(
        deployService.createVersion("project-123", "user-456"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("deployToVercel", () => {
    it("should return not implemented error for Stage 2", async () => {
      const { projectVersionRepository } = await import("@/lib/db/repository");

      const mockVersion = {
        id: "version-123",
        projectId: "project-123",
        versionNumber: 1,
      };

      (projectVersionRepository.findById as any).mockResolvedValue(mockVersion);

      const result = await deployService.deployToVercel?.(
        "project-123",
        "version-123",
      );

      expect(result?.success).toBe(false);
      expect(result?.error).toContain("not yet implemented");
    });
  });
});
