import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name is too long"),
  description: z.string().optional(),
  templateUsed: z.string().optional(),
  externalProjectId: z
    .string()
    .min(1, "External project ID is required")
    .max(128),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  vercelPreviewUrl: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
});

export const saveFileSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string(),
  mimeType: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveFileInput = z.infer<typeof saveFileSchema>;
