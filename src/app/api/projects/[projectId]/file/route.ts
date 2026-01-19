import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { projectFileRepository } from "@/lib/db/repository";
import { serverFileStorage } from "@/lib/file-storage";
import { saveFileSchema } from "../../validations";
import logger from "logger";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 },
      );
    }

    // Check ownership
    const hasAccess = await projectFileRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const file = await projectFileRepository.getFile(projectId, path);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Download content from storage
    const contentBuffer = await serverFileStorage.download(file.blobPath);
    const content = contentBuffer.toString("utf-8");

    return NextResponse.json({
      path: file.path,
      content,
      mimeType: file.mimeType,
      isBinary: file.isBinary,
    });
  } catch (error) {
    const { projectId } = await params;
    logger.error("Failed to read project file", {
      error,
      projectId,
    });
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check ownership
    const hasAccess = await projectFileRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = saveFileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { path, content, mimeType } = validationResult.data;

    // Upload content to storage
    const blobPath = `projects/${projectId}/working/${path}`;
    const contentBuffer = Buffer.from(content, "utf-8");

    await serverFileStorage.upload(contentBuffer, {
      filename: blobPath,
      contentType: mimeType || "text/plain",
    });

    // Calculate content hash
    const contentHash = crypto
      .createHash("sha256")
      .update(content)
      .digest("hex");

    // Upsert file metadata in database
    const file = await projectFileRepository.upsertFile({
      projectId,
      versionId: null, // Working copy
      path,
      mimeType: mimeType || "text/plain",
      sizeBytes: String(contentBuffer.length),
      contentHash,
      blobPath,
      isBinary: false,
    });

    logger.info("Project file saved via API", {
      projectId,
      path,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        path: file.path,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      },
    });
  } catch (error) {
    const { projectId } = await params;
    logger.error("Failed to save project file", {
      error,
      projectId,
    });
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
