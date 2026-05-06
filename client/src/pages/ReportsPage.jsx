import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadLeadsReportPdf } from '../api/reports';
import { fetchSalespeople } from '../api/salespeople';
import { LEAD_SOURCE_OPTIONS, LEAD_STATUSES } from '../components/LeadForm';

const OUTCOME_OPTIONS = [
  { value: 'all', label: 'All outcomes' },
  { value: 'won', label: 'Won only' },
  { value: 'lost', label: 'Lost only' },
  { value: 'open', label: 'Open pipeline (not won or lost)' },
];

export function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role ?? 'admin') === 'admin';

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [outcome, setOutcome] = useState('all');
  const [statusSet, setStatusSet] = useState(() => new Set());
  const [leadSource, setLeadSource] = useState('');
  const [salespersonId, setSalespersonId] = useState('');
  const [search, setSearch] = useState('');

  const [salespeople, setSalespeople] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoadingRoster(true);
      try {
        const list = await fetchSalespeople();
        if (!cancelled) setSalespeople(list);
      } catch {
        if (!cancelled) setSalespeople([]);
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const queryParams = useMemo(() => {
    const params = {};
    if (from.trim()) params.from = from.trim();
    if (to.trim()) params.to = to.trim();
    if (outcome !== 'all') {
      params.result = outcome;
    } else if (statusSet.size > 0) {
      params.status = [...statusSet].join(',');
    }
    if (leadSource) params.leadSource = leadSource;
    if (isAdmin && salespersonId) params.salesperson = salespersonId;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [from, to, outcome, statusSet, leadSource, salespersonId, search, isAdmin]);

  const toggleStatus = useCallback((status) => {
    setStatusSet((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const handleDownload = async () => {
    setError('');
    setBusy(true);
    try {
      await downloadLeadsReportPdf(queryParams);
    } catch (e) {
      let msg = e.response?.data?.message || e.message;
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text().catch(() => '');
        try {
          const parsed = JSON.parse(text);
          msg = parsed.message || parsed.error || text;
        } catch {
          msg = text || msg;
        }
      }
      setError(typeof msg === 'string' && msg ? msg : 'Could not generate the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Export a PDF of leads. Filters respect your role: sales users only see their own leads.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Leads PDF</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Created from</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Created to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="font-medium text-slate-700">Outcome</span>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {outcome === 'all' ? (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-700">Statuses (optional)</legend>
            <p className="mt-1 text-xs text-slate-500">
              Leave all unchecked to include every status. Select one or more to narrow the export.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEAD_STATUSES.map((s) => (
                <label
                  key={s}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={statusSet.has(s)}
                    onChange={() => toggleStatus(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Lead source</span>
            <select
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              {LEAD_SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {isAdmin ? (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Salesperson</span>
              <select
                value={salespersonId}
                onChange={(e) => setSalespersonId(e.target.value)}
                disabled={loadingRoster}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">All salespeople</option>
                {salespeople.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <label className="mt-4 block text-sm">
          <span className="font-medium text-slate-700">Search (name, company, email)</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full max-w-xl rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
