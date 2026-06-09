import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Plus, Film } from "lucide-react";
import type { Project } from "@/lib/db.server";
import { ProjectCard } from "./_authenticated.dashboard";
import { listProjects } from "@/lib/api/server-fns";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — SOTA Flovo" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then(({ projects: data }) => {
        setProjects(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const location = useLocation();
  const isChildRoute = location.pathname !== "/projects";

  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <>
      <TopBar title="Projects" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 
              style={{
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              All projects
            </h2>
            <p 
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)'
              }}
            >
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link 
            to="/projects/new" 
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus className="h-4 w-4" /> New project
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                style={{
                  height: '200px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 40px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '100px',
                background: 'radial-gradient(ellipse, var(--primary-100) 0%, transparent 70%)',
                opacity: 0.5
              }}
            />
            <div 
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-md), 0 0 0 1px rgba(255,255,255,0.5) inset',
                position: 'relative',
                animation: 'float 6s ease-in-out infinite'
              }}
            >
              <Film className="h-8 w-8" style={{ color: 'var(--primary-600)' }} />
            </div>
            <h4 
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Your studio is empty
            </h4>
            <p 
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                maxWidth: '400px'
              }}
            >
              Create your first project to see it here.
            </p>
            <Link 
              to="/projects/new" 
              className="btn-primary"
            >
              New project
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </main>
    </>
  );
}
