import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { projectVersionRepository } from "@/lib/db/repository";
import logger from "logger";

export async function GET(
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

    const { versionId } = await params;

    // Check ownership
    const hasAccess = await projectVersionRepository.checkAccess(
      versionId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const version = await projectVersionRepository.findById(versionId);

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Get version files
    const files = await projectVersionRepository.getVersionFiles(versionId);

    return NextResponse.json({
      ...version,
      files,
    });
  } catch (error) {
    const { versionId } = await params;
    logger.error("Failed to get version", {
      error,
      versionId,
    });
    return NextResponse.json(
      { error: "Failed to get version" },
      { status: 500 },
    );
  }
}
