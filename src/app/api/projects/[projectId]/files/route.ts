import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { projectFileRepository } from "@/lib/db/repository";
import logger from "logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Check ownership
    const hasAccess = await projectFileRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const files = await projectFileRepository.listFiles(projectId);

    return NextResponse.json(files);
  } catch (error) {
    logger.error("Failed to list project files", {
      error,
      projectId: params.projectId,
    });
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 },
    );
  }
}
