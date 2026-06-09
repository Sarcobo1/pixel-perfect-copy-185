import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Settings, CreditCard, Zap, Plus } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/billing", label: "Billing", icon: CreditCard },
] as const;

export function AppSidebar() {
  const { location } = useRouterState();
  return (
    <aside 
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r md:flex"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
        padding: '24px 16px',
        gap: '8px'
      }}
    >
      {/* Logo */}
      <Link 
        to="/dashboard" 
        className="mb-6 flex items-center gap-3 px-4 font-bold tracking-tight"
        style={{
          fontSize: '20px',
          letterSpacing: '-0.02em'
        }}
      >
        <span 
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
            boxShadow: 'var(--shadow-sm), 0 0 0 1px rgba(255,255,255,0.1) inset',
            color: 'white'
          }}
        >
          <Zap className="h-5 w-5" />
        </span>
        SOTA <span style={{ color: 'var(--primary-500)' }}>Flovo</span>
      </Link>

      {/* New Project Button */}
      <a
        href="/projects/new"
        className="btn-primary mb-4 justify-center"
        style={{
          width: '100%',
          padding: '12px 20px'
        }}
      >
        <Plus className="h-4 w-4" /> New project
      </a>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 mb-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--primary-700)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: active ? '600' : '500',
                transition: 'all var(--duration-fast) var(--ease-out)',
                cursor: 'pointer',
                background: active ? 'var(--primary-50)' : 'transparent',
                boxShadow: active ? '0 0 0 1px var(--primary-200)' : 'none',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '20px',
                    background: 'var(--primary-500)',
                    borderRadius: '0 4px 4px 0'
                  }}
                />
              )}
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pro Tip Card */}
      <div 
        className="mt-auto p-5"
        style={{
          background: 'linear-gradient(135deg, var(--primary-50), #fff)',
          border: '1px solid var(--primary-100)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, var(--primary-200) 0%, transparent 70%)',
            opacity: 0.3
          }}
        />
        <div 
          style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--primary-600)',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1
          }}
        >
          ⚡ Pro tip
        </div>
        <p 
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
            position: 'relative',
            zIndex: 1
          }}
        >
          Connect your brand URL to auto-extract logos &amp; colors in one click.
        </p>
      </div>
    </aside>
  );
}
