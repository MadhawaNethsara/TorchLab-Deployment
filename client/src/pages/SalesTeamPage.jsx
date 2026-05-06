import { useCallback, useEffect, useState } from 'react';
import { createSalesperson, fetchSalespeople } from '../api/salespeople';

export function SalesTeamPage() {
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setListError('');
    return fetchSalespeople()
      .then(setSalespeople)
      .catch(() => setListError('Could not load sales team.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Name is required.');
      return;
    }
    const le = loginEmail.trim().toLowerCase();
    const lp = loginPassword;
    if ((le && !lp) || (!le && lp)) {
      setFormError('Portal login: provide both email and password, or leave both blank.');
      return;
    }
    setSaving(true);
    try {
      await createSalesperson({
        name: trimmed,
        email: email.trim() || undefined,
        ...(le && lp
          ? { loginEmail: le, password: lp }
          : {}),
      });
      setName('');
      setEmail('');
      setLoginEmail('');
      setLoginPassword('');
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Could not add salesperson.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Sales team
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Add reps and optionally enable a portal login so they see only their assigned leads.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add salesperson</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="sp-name" className="block text-xs font-medium uppercase text-slate-500">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                id="sp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="sp-email" className="block text-xs font-medium uppercase text-slate-500">
                Contact email (optional)
              </label>
              <input
                id="sp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@company.com"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="sp-login-email" className="block text-xs font-medium uppercase text-slate-500">
                Portal login email (optional)
              </label>
              <input
                id="sp-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Used only to sign in"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sp-login-password" className="block text-xs font-medium uppercase text-slate-500">
                Portal password (optional, min 8 characters)
              </label>
              <input
                id="sp-login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Leave blank if no portal access"
                autoComplete="new-password"
                className="mt-1 max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </form>
        {formError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Team members</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : listError ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{listError}</p>
        ) : salespeople.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No salespeople yet. Add your first teammate above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {salespeople.map((sp) => (
              <li
                key={sp._id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">{sp.name}</span>
                  {sp.loginEmail ? (
                    <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Portal
                    </span>
                  ) : null}
                </div>
                <div className="text-right text-slate-600">
                  <div>{sp.email || '—'}</div>
                  {sp.loginEmail ? (
                    <div className="text-xs text-slate-500">Login: {sp.loginEmail}</div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
