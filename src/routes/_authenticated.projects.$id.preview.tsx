import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProject } from "@/lib/api/server-fns";
import { TopBar } from "@/components/layout/TopBar";
import { MotionVideoPlayer } from "@/components/MotionVideoPlayer";
import { RotateCcw, Edit2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$id/preview")({
  head: () => ({ meta: [{ title: "Video Preview — SOTA Flovo" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    brandUrl: typeof search.brandUrl === "string" ? search.brandUrl : undefined,
  }),
  component: ProjectVideoPreviewPage,
});

function ProjectVideoPreviewPage() {
  const { id } = useParams({ from: "/_authenticated/projects/$id/preview" });
  const navigate = useNavigate();
  const [project, setProject] = useState<{
    name?: string;
    html_code?: string;
    prompt?: string;
    brand_identity?: { brand_name?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject({ data: { id } })
      .then(({ project: data }) => {
        if (!data) {
          toast.error("Project not found");
          setTimeout(() => navigate({ to: "/projects" }), 2000);
          return;
        }
        setProject(data);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load project");
        setTimeout(() => navigate({ to: "/projects" }), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project?.html_code) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Video not found</h1>
        <button
          onClick={() => navigate({ to: "/projects/new" })}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Create new video
        </button>
      </div>
    );
  }

  const brandName =
    project.brand_identity?.brand_name ?? project.name ?? "video";

  return (
    <>
      <TopBar title={project.name || "Video Preview"} />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {project.name}
        </h1>

        <MotionVideoPlayer
          htmlCode={project.html_code}
          brandName={brandName}
          autoExport
        />

        {project.prompt && (
          <p className="text-sm text-muted-foreground">
            Source: {project.prompt}
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate({ to: "/projects/new" })}
            className="flex items-center gap-2 rounded-full border border-primary bg-transparent px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <RotateCcw className="h-4 w-4" /> New video
          </button>
          <button
            onClick={() =>
              navigate({
                to: "/projects/$id",
                params: { id },
                search: { brandUrl: undefined },
              })
            }
            className="flex items-center gap-2 rounded-full border border-muted-foreground bg-transparent px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted-foreground/5"
          >
            <Edit2 className="h-4 w-4" /> Editor
          </button>
        </div>
      </main>
    </>
  );
}
