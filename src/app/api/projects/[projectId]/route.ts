import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { projectRepository } from "@/lib/db/repository";
import { updateProjectSchema } from "../validations";
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
    const hasAccess = await projectRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await projectRepository.findById(projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Failed to get project", {
      error,
      projectId: params.projectId,
    });
    return NextResponse.json(
      { error: "Failed to get project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const hasAccess = await projectRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const project = await projectRepository.update(
      projectId,
      validationResult.data,
    );

    logger.info("Project updated via API", {
      projectId,
      userId: session.user.id,
    });

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Failed to update project", {
      error,
      projectId: params.projectId,
    });
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const hasAccess = await projectRepository.checkAccess(
      projectId,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await projectRepository.delete(projectId);

    logger.info("Project deleted via API", {
      projectId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete project", {
      error,
      projectId: params.projectId,
    });
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
