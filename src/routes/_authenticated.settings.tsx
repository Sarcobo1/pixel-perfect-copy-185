import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/api/server-fns";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — SOTA Flovo" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        setDisplayName((profile as any)?.display_name ?? "");
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ data: { display_name: displayName } });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar title="Settings" />
      <main className="mx-auto max-w-3xl px-6 py-10" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Section title="Profile" desc="Your display name across the studio.">
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              marginBottom: '8px'
            }}>
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="form-input"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              value=""
              disabled
              className="form-input"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </Section>

        <Section title="Preferences" desc="Customise your studio experience.">
          <Toggle label="Email notifications" defaultOn />
          <Toggle label="Render-complete alerts" defaultOn />
          <Toggle label="Marketing updates" />
        </Section>

        <Section title="Danger zone" desc="Irreversible actions.">
          <button className="btn-danger">
            Delete account
          </button>
        </Section>
      </main>
    </>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div 
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        transition: 'box-shadow var(--duration-normal) var(--ease-out)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <h2 
        style={{
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '-0.01em',
          marginBottom: '4px',
          color: 'var(--text-primary)'
        }}
      >
        {title}
      </h2>
      <p 
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '24px'
        }}
      >
        {desc}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: 'var(--text-primary)'
      }}>
        {label}
      </span>
      <button
        onClick={() => setOn(!on)}
        className={on ? 'toggle active' : 'toggle'}
        style={{
          background: on ? 'linear-gradient(135deg, var(--primary-400), var(--primary-500))' : 'var(--bg-tertiary)'
        }}
      />
    </div>
  );
}
