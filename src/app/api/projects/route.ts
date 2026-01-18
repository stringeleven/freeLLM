import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { projectRepository } from "@/lib/db/repository";
import { createProjectSchema } from "./validations";
import logger from "logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await projectRepository.findByUserId(session.user.id);

    return NextResponse.json(projects);
  } catch (error) {
    logger.error("Failed to list projects", { error });
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const project = await projectRepository.create({
      ...validationResult.data,
      userId: session.user.id,
    });

    logger.info("Project created via API", {
      projectId: project.id,
      userId: session.user.id,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error("Failed to create project", { error });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
