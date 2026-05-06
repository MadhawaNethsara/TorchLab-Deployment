import { useEffect, useMemo, useState } from 'react';
import { fetchDashboardStats } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';

function formatCount(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function StatCard({ label, value, variant = 'count', accent = 'slate' }) {
  const accentRing = {
    slate: 'ring-slate-200/80',
    indigo: 'ring-indigo-200/80',
    emerald: 'ring-emerald-200/80',
    amber: 'ring-amber-200/80',
    rose: 'ring-rose-200/80',
    violet: 'ring-violet-200/80',
  }[accent];

  const accentBg = {
    slate: 'from-slate-50 to-white',
    indigo: 'from-indigo-50/80 to-white',
    emerald: 'from-emerald-50/80 to-white',
    amber: 'from-amber-50/80 to-white',
    rose: 'from-rose-50/80 to-white',
    violet: 'from-violet-50/80 to-white',
  }[accent];

  const display =
    variant === 'currency' ? formatCurrency(value) : formatCount(value);

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br ${accentBg} p-5 shadow-sm ring-1 ${accentRing}`}
    >
      <h2 className="text-sm font-medium text-slate-600">{label}</h2>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
        {display}
      </p>
    </article>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setError('');
    fetchDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Total Leads',
        value: stats?.totalLeads,
        variant: 'count',
        accent: 'indigo',
      },
      {
        label: 'New Leads',
        value: stats?.newLeads,
        variant: 'count',
        accent: 'slate',
      },
      {
        label: 'Qualified Leads',
        value: stats?.qualifiedLeads,
        variant: 'count',
        accent: 'violet',
      },
      {
        label: 'Won Leads',
        value: stats?.wonLeads,
        variant: 'count',
        accent: 'emerald',
      },
      {
        label: 'Lost Leads',
        value: stats?.lostLeads,
        variant: 'count',
        accent: 'rose',
      },
      {
        label: 'Total Deal Value',
        value: stats?.totalDealValue,
        variant: 'currency',
        accent: 'amber',
      },
      {
        label: 'Won Deal Value',
        value: stats?.totalWonValue,
        variant: 'currency',
        accent: 'emerald',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {user?.role === 'sales'
            ? 'Metrics for leads assigned to you.'
            : 'Snapshot of your full pipeline.'}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-100/80"
              aria-hidden
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              variant={card.variant}
              accent={card.accent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
