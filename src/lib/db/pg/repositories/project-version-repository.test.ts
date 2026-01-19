import { describe, it, expect, vi } from "vitest";
import { pgProjectVersionRepository } from "./project-version-repository.pg";

// Mock the database and logger
vi.mock("../db.pg", () => ({
  pgDb: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Project Version Repository Tests", () => {
  describe("create", () => {
    it("should create version with correct version number", async () => {
      const { pgDb } = await import("../db.pg");
      const mockVersion = {
        id: "version-123",
        projectId: "project-123",
        versionNumber: 1,
        createdBy: "user-123",
        changeSummary: "Initial version",
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockVersion]),
        }),
      });

      (pgDb.insert as any) = mockInsert;

      const version = await pgProjectVersionRepository.create({
        projectId: "project-123",
        versionNumber: 1,
        createdBy: "user-123",
        changeSummary: "Initial version",
      });

      expect(version.versionNumber).toBe(1);
      expect(version.projectId).toBe("project-123");
    });
  });

  describe("findByProjectId", () => {
    it("should return versions ordered by version number descending", async () => {
      const { pgDb } = await import("../db.pg");
      const mockVersions = [
        { id: "v3", versionNumber: 3 },
        { id: "v2", versionNumber: 2 },
        { id: "v1", versionNumber: 1 },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockVersions),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const versions =
        await pgProjectVersionRepository.findByProjectId("project-123");

      expect(versions).toHaveLength(3);
      expect(versions[0].versionNumber).toBe(3);
      expect(versions[2].versionNumber).toBe(1);
    });
  });

  describe("getLatestVersion", () => {
    it("should return the highest version number", async () => {
      const { pgDb } = await import("../db.pg");
      const mockVersion = { id: "v3", versionNumber: 3 };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockVersion]),
            }),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const version =
        await pgProjectVersionRepository.getLatestVersion("project-123");

      expect(version).not.toBeNull();
      expect(version?.versionNumber).toBe(3);
    });

    it("should return null when no versions exist", async () => {
      const { pgDb } = await import("../db.pg");

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const version =
        await pgProjectVersionRepository.getLatestVersion("project-123");

      expect(version).toBeNull();
    });
  });

  describe("checkAccess", () => {
    it("should return true when user owns the project", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ userId: "user-123" }]),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const hasAccess = await pgProjectVersionRepository.checkAccess(
        "version-123",
        "user-123",
      );

      expect(hasAccess).toBe(true);
    });

    it("should return false when user does not own the project", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const hasAccess = await pgProjectVersionRepository.checkAccess(
        "version-123",
        "user-456",
      );

      expect(hasAccess).toBe(false);
    });
  });
});
