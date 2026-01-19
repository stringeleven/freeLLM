import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import {
  projectRepository,
  projectVersionRepository,
} from "@/lib/db/repository";
import logger from "logger";

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

    // Check ownership
    const hasAccess = await projectRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await projectVersionRepository.findByProjectId(projectId);

    return NextResponse.json(versions);
  } catch (error) {
    const { projectId } = await params;
    logger.error("Failed to list project versions", {
      error,
      projectId,
    });
    return NextResponse.json(
      { error: "Failed to list versions" },
      { status: 500 },
    );
  }
}
