import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Check, Sparkles, Zap, Code2 } from "lucide-react";
import { getProfile } from "@/lib/api/server-fns";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — SOTA Flovo" }] }),
  component: BillingPage,
});

const plans = [
  { key: "free" as const, name: "Free", price: "$0", icon: Sparkles, perks: ["3 videos / month", "720p export", "Watermark"] },
  { key: "pro" as const, name: "Pro", price: "$29", icon: Zap, perks: ["Unlimited videos", "4K export", "Custom voices", "No watermark"], highlight: true },
  { key: "api" as const, name: "API", price: "$99", icon: Code2, perks: ["Programmatic render", "Webhooks", "10k frames"] },
];

function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro" | "api">("free");

  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        if ((profile as any)?.plan) setCurrentPlan((profile as any).plan);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <TopBar title="Billing" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-10">
          <h2 
            style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}
          >
            Plan &amp; billing
          </h2>
          <p 
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)'
            }}
          >
            You're currently on the <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{currentPlan}</span> plan.
          </p>
        </div>

        {/* Pricing Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {plans.map((p) => {
            const Icon = p.icon;
            const active = currentPlan === p.key;
            return (
              <div
                key={p.key}
                className="card-base"
                style={{
                  background: p.highlight ? 'linear-gradient(135deg, #fff, var(--primary-50))' : 'var(--surface)',
                  borderColor: p.highlight ? 'var(--primary-200)' : 'var(--border-subtle)',
                  boxShadow: p.highlight ? 'var(--shadow-lg), var(--shadow-glow)' : 'var(--shadow-sm)',
                  transform: p.highlight ? 'scale(1.02)' : 'scale(1)',
                  position: 'relative'
                }}
              >
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 12px',
                      background: 'linear-gradient(135deg, var(--primary-400), var(--primary-500))',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                      borderRadius: '0 0 var(--radius-md) var(--radius-md)'
                    }}
                  >
                    CURRENT
                  </div>
                )}
                <div className="stat-icon stat-icon-green" style={{ marginBottom: '16px' }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  {p.name}
                </h3>
                <div 
                  style={{
                    fontSize: '42px',
                    fontWeight: '800',
                    letterSpacing: '-0.04em',
                    color: 'var(--text-primary)',
                    lineHeight: '1',
                    marginBottom: '24px'
                  }}
                >
                  {p.price}<span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-tertiary)' }}>/mo</span>
                </div>
                <ul 
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px 0'
                  }}
                >
                  {p.perks.map((perk) => (
                    <li 
                      key={perk} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        padding: '6px 0'
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-600)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          flexShrink: 0
                        }}
                      >
                        ✓
                      </div>
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={active}
                  className={active ? 'btn-base' : p.highlight ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: active ? 'default' : 'pointer',
                    opacity: active ? 0.6 : 1
                  }}
                >
                  {active ? "Current plan" : `Switch to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Method */}
        <div 
          className="card-base"
          style={{
            padding: '32px'
          }}
        >
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '8px'
            }}
          >
            Payment method
          </h3>
          <p 
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            No payment method on file.
          </p>
          <button className="btn-secondary">
            Add payment method
          </button>
        </div>
      </main>
    </>
  );
}
