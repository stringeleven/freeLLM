import { ProjectWorkspace } from "@/features/projects/components/ProjectWorkspace";

export default function ProjectWorkspaceRoute({
  params,
}: {
  params: { projectId: string };
}) {
  return <ProjectWorkspace projectId={params.projectId} />;
}
