import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import {
  projectVersionRepository,
  projectFileRepository,
} from "@/lib/db/repository";
import logger from "logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; versionId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, versionId } = await params;

    // Check ownership
    const hasAccess = await projectVersionRepository.checkAccess(
      versionId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Restore version to working copy
    const fileCount = await projectFileRepository.restoreVersion(
      projectId,
      versionId,
    );

    logger.info("Version restored via API", {
      projectId,
      versionId,
      fileCount,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      fileCount,
      message: `Restored ${fileCount} files to working copy`,
    });
  } catch (error) {
    const { projectId, versionId } = await params;
    logger.error("Failed to restore version", {
      error,
      projectId,
      versionId,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Failed to restore version";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
