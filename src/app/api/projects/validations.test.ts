import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  saveFileSchema,
} from "./validations";

describe("Project Validations", () => {
  describe("createProjectSchema", () => {
    it("should validate valid project creation input", () => {
      const validInput = {
        name: "Test Project",
        description: "A test project",
        templateUsed: "nextjs",
        externalProjectId: "ext_123",
      };

      const result = createProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty project name", () => {
      const invalidInput = {
        name: "",
        externalProjectId: "ext_123",
      };

      const result = createProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject missing external project ID", () => {
      const invalidInput = {
        name: "Test Project",
      };

      const result = createProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should allow optional fields to be omitted", () => {
      const validInput = {
        name: "Test Project",
        externalProjectId: "ext_123",
      };

      const result = createProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject project name exceeding max length", () => {
      const invalidInput = {
        name: "a".repeat(256),
        externalProjectId: "ext_123",
      };

      const result = createProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("should validate valid project update input", () => {
      const validInput = {
        name: "Updated Project",
        description: "Updated description",
        status: "active" as const,
        vercelPreviewUrl: "https://example.vercel.app",
      };

      const result = updateProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should allow partial updates", () => {
      const validInput = {
        name: "Updated Project",
      };

      const result = updateProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalidInput = {
        status: "invalid_status",
      };

      const result = updateProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject invalid URL format", () => {
      const invalidInput = {
        vercelPreviewUrl: "not-a-valid-url",
      };

      const result = updateProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should allow empty string for vercelPreviewUrl", () => {
      const validInput = {
        vercelPreviewUrl: "",
      };

      const result = updateProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should allow all valid status values", () => {
      const statuses = ["draft", "active", "archived"] as const;

      for (const status of statuses) {
        const result = updateProjectSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("saveFileSchema", () => {
    it("should validate valid file save input", () => {
      const validInput = {
        path: "src/index.ts",
        content: "console.log('hello');",
        mimeType: "text/typescript",
      };

      const result = saveFileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty file path", () => {
      const invalidInput = {
        path: "",
        content: "some content",
      };

      const result = saveFileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should allow empty content", () => {
      const validInput = {
        path: "src/empty.ts",
        content: "",
      };

      const result = saveFileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should allow mimeType to be optional", () => {
      const validInput = {
        path: "src/file.txt",
        content: "some content",
      };

      const result = saveFileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const invalidInput = {
        path: "src/file.txt",
      };

      const result = saveFileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
