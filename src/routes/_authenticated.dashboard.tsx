import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sparkles, Plus, Clock, Film, TrendingUp, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/db.server";
import { listProjects } from "@/lib/api/server-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SOTA Flovo" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then(({ projects: data }) => {
        setProjects((data ?? []).slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === "done").length;
  const totalMinutesSaved = projects.length * 42;

  const stats = [
    { label: "Projects", value: totalProjects.toString(), icon: Film },
    { label: "Renders completed", value: completedProjects.toString(), icon: TrendingUp },
    { label: "Minutes saved", value: totalMinutesSaved.toString(), icon: Clock },
  ];

  const displayName = "founder";

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Quick Start Banner - Premium Design */}
        <div 
          className="animate-in relative mb-10 overflow-hidden p-8 md:p-10"
          style={{
            background: 'linear-gradient(135deg, var(--primary-50) 0%, #fff 50%, var(--primary-50) 100%)',
            border: '1px solid var(--primary-100)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, var(--primary-200) 0%, transparent 70%)',
              opacity: 0.2,
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(124, 184, 42, 0.1)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--primary-700)',
                  marginBottom: '16px'
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Quick Start
              </div>
              <h2 
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                Hi {displayName}, ready to ship your next reel?
              </h2>
              <p 
                style={{
                  marginTop: '8px',
                  maxWidth: '500px',
                  fontSize: '15px',
                  color: 'var(--text-secondary)'
                }}
              >
                Start from a brand URL and we'll auto-extract everything you need.
              </p>
            </div>
            <Link
              to="/projects/new"
              className="btn-primary shrink-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus className="h-4 w-4" /> New project
            </Link>
          </div>
        </div>

        {/* Stats Grid - Premium Design */}
        <div className="stats-grid mb-10" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {stats.map((s, index) => {
            const Icon = s.icon;
            return (
              <div 
                key={s.label} 
                className="card-base animate-in"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div 
                  className="stat-icon stat-icon-green"
                  style={{
                    marginBottom: '16px'
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Projects Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 
            style={{
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}
          >
            Recent projects
          </h3>
          <Link 
            to="/projects"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--primary-600)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all var(--duration-fast) var(--ease-out)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {[0, 1, 2].map((i) => (
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
              No projects yet
            </h4>
            <p 
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                maxWidth: '400px'
              }}
            >
              Start your first motion brand reel — it takes less than 5 minutes.
            </p>
            <Link 
              to="/projects/new" 
              className="btn-primary"
            >
              Create first project
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

export function ProjectCard({ project }: { project: Project }) {
  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    processing: "bg-primary-soft text-primary-hover animate-lime-dot",
    done: "bg-primary text-primary-foreground",
    failed: "bg-destructive/10 text-destructive",
  };

  const brandName = project.brand_identity && typeof project.brand_identity === "object" && "brand" in project.brand_identity
    ? (project.brand_identity as any).brand?.name
    : null;
  const displayName = brandName || project.name;

  return (
    <Link
      to="/projects/$id"
      params={{ id: project.id }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-card-hover"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-canvas to-canvas/80">
        {project.thumbnail_url && <img src={project.thumbnail_url} alt={displayName} className="h-full w-full object-cover" />}
        {project.html_code && !project.thumbnail_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary-soft/20">
            <span className="text-xs font-semibold text-primary-hover">AI Generated</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Open</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display font-semibold tracking-tight truncate text-sm">{displayName}</h4>
          <span className={`text-label-mono rounded-full px-2 py-0.5 text-xs ${statusColor[project.status]}`}>{project.status}</span>
        </div>
        {project.prompt && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.prompt}</p>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {Math.round(project.duration_ms / 1000)}s
          <ArrowRight className="ml-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
