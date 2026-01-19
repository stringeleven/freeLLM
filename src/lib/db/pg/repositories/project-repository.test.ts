import { describe, it, expect, vi } from "vitest";
import { pgProjectRepository } from "./project-repository.pg";

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
  },
}));

describe("Project Repository - Ownership Tests", () => {
  describe("checkAccess", () => {
    it("should return true when user owns the project", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ userId: "user-123" }]),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const hasAccess = await pgProjectRepository.checkAccess(
        "project-123",
        "user-123",
      );

      expect(hasAccess).toBe(true);
    });

    it("should return false when user does not own the project", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const hasAccess = await pgProjectRepository.checkAccess(
        "project-123",
        "user-456",
      );

      expect(hasAccess).toBe(false);
    });

    it("should return false when project does not exist", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const hasAccess = await pgProjectRepository.checkAccess(
        "nonexistent-project",
        "user-123",
      );

      expect(hasAccess).toBe(false);
    });
  });

  describe("findByUserId", () => {
    it("should only return projects owned by the specified user", async () => {
      const { pgDb } = await import("../db.pg");
      const mockProjects = [
        { id: "proj-1", userId: "user-123", name: "Project 1" },
        { id: "proj-2", userId: "user-123", name: "Project 2" },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockProjects),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const projects = await pgProjectRepository.findByUserId("user-123");

      expect(projects).toHaveLength(2);
      expect(projects.every((p) => p.userId === "user-123")).toBe(true);
    });

    it("should return empty array when user has no projects", async () => {
      const { pgDb } = await import("../db.pg");
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (pgDb.select as any) = mockSelect;

      const projects = await pgProjectRepository.findByUserId(
        "user-with-no-projects",
      );

      expect(projects).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create project with correct userId", async () => {
      const { pgDb } = await import("../db.pg");
      const mockProject = {
        id: "new-project-id",
        userId: "user-123",
        name: "New Project",
        externalProjectId: "ext-123",
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProject]),
        }),
      });

      (pgDb.insert as any) = mockInsert;

      const project = await pgProjectRepository.create({
        userId: "user-123",
        name: "New Project",
        externalProjectId: "ext-123",
      });

      expect(project.userId).toBe("user-123");
      expect(project.name).toBe("New Project");
    });
  });
});
