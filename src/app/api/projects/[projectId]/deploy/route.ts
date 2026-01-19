import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth/server";
import { deployService } from "@/lib/deploy/deploy-service";
import { z } from "zod";
import logger from "logger";

const deploySchema = z.object({
  changeSummary: z.string().optional(),
});

export async function POST(
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
    const body = await request.json();
    const validationResult = deploySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const version = await deployService.createVersion(
      projectId,
      session.user.id,
      validationResult.data.changeSummary,
    );

    logger.info("Version deployed via API", {
      projectId,
      versionId: version.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (error) {
    const { projectId } = await params;
    logger.error("Failed to deploy project", {
      error,
      projectId,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Failed to deploy project";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
