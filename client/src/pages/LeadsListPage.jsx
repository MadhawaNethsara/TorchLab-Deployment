import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createLead,
  deleteLead,
  fetchLeads,
  updateLead,
} from '../api/leads';
import { fetchSalespeople } from '../api/salespeople';
import {
  getDefaultLeadFormValues,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUSES,
  LeadForm,
  mapLeadToFormValues,
} from '../components/LeadForm';
import { Modal } from '../components/Modal';

export function LeadsListPage() {
  const { user } = useAuth();
  const isSales = user?.role === 'sales';
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    leadSource: '',
    salesperson: '',
    search: '',
  });

  const [salespeople, setSalespeople] = useState([]);

  const [formModal, setFormModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  /** Lead id while a quick status change is in flight (row-level saving). */
  const [quickStatusLeadId, setQuickStatusLeadId] = useState(null);
  const [quickStatusError, setQuickStatusError] = useState('');

  const queryParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== ''),
      ),
    [filters],
  );

  const loadLeads = useCallback(() => {
    setLoading(true);
    setError('');
    return fetchLeads(queryParams)
      .then(setLeads)
      .catch(() => setError('Could not load leads.'))
      .finally(() => setLoading(false));
  }, [queryParams]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    fetchSalespeople()
      .then(setSalespeople)
      .catch(() => setSalespeople([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchDraft ? prev : { ...prev, search: searchDraft },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setFormError('');
    setFormModal('create');
  }

  function openEdit(lead) {
    setFormError('');
    setFormModal({ mode: 'edit', lead });
  }

  function closeFormModal() {
    if (formSaving) return;
    setFormModal(null);
    setFormError('');
  }

  async function handleLeadSubmit(payload) {
    setFormError('');
    setFormSaving(true);
    try {
      if (formModal === 'create') {
        await createLead(payload);
      } else if (formModal?.mode === 'edit' && formModal.lead?._id) {
        await updateLead(formModal.lead._id, payload);
      }
      closeFormModal();
      await loadLeads();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Something went wrong. Try again.';
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  }

  async function handleQuickStatusChange(leadId, previousStatus, nextStatus) {
    if (nextStatus === previousStatus) return;
    setQuickStatusError('');
    setQuickStatusLeadId(leadId);
    setLeads((prev) =>
      prev.map((l) =>
        l._id === leadId ? { ...l, status: nextStatus } : l,
      ),
    );
    try {
      await updateLead(leadId, { status: nextStatus });
    } catch {
      setQuickStatusError('Could not update status. Try again.');
      setLeads((prev) =>
        prev.map((l) =>
          l._id === leadId ? { ...l, status: previousStatus } : l,
        ),
      );
    } finally {
      setQuickStatusLeadId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleteError('');
    setDeleteBusy(true);
    try {
      await deleteLead(deleteTarget._id);
      setDeleteTarget(null);
      await loadLeads();
    } catch {
      setDeleteError('Could not delete this lead.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const formOpen = formModal === 'create' || formModal?.mode === 'edit';
  const formTitle =
    formModal === 'create' ? 'Create lead' : 'Edit lead';
  const formKey =
    formModal === 'create' ? 'create' : formModal?.lead?._id ?? 'edit';
  const formDefaults = useMemo(() => {
    if (formModal === 'create') {
      const base = getDefaultLeadFormValues();
      if (isSales && user?.salespersonId) {
        return { ...base, salespersonId: user.salespersonId };
      }
      return base;
    }
    return mapLeadToFormValues(formModal?.lead);
  }, [formModal, isSales, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isSales
              ? 'Your assigned leads. Update status and details as you progress deals.'
              : 'Search, filter, and manage your pipeline. Update status directly from the table.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        {!isSales ? (
        <Link
          to="/sales-team"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Sales team
        </Link>
        ) : null}
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="-ml-0.5 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create lead
        </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search name, company, or email…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.leadSource}
              onChange={(e) => updateFilter('leadSource', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All sources</option>
              {LEAD_SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {!isSales ? (
              <select
                value={filters.salesperson}
                onChange={(e) => updateFilter('salesperson', e.target.value)}
                className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All salespeople</option>
                {salespeople.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </div>

      {quickStatusError ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        >
          {quickStatusError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-slate-500">
          Loading leads…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
          No leads match your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Lead</th>
                  <th className="hidden px-4 py-3 md:table-cell">Company</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Source</th>
                  <th className="hidden px-4 py-3 md:table-cell">Assigned</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead._id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        to={`/leads/${lead._id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {lead.leadName}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-700 md:table-cell">
                      {lead.companyName || '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">
                      {lead.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`status-${lead._id}`}>
                        Status for {lead.leadName}
                      </label>
                      <select
                        id={`status-${lead._id}`}
                        value={lead.status}
                        disabled={quickStatusLeadId === lead._id}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            lead._id,
                            lead.status,
                            e.target.value,
                          )
                        }
                        className="max-w-[12rem] cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {LEAD_SOURCE_OPTIONS.find((s) => s.value === lead.leadSource)
                        ?.label || lead.leadSource}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-700 md:table-cell">
                      {lead.salesperson?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {lead.dealValue != null ? lead.dealValue : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(lead)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {!isSales ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(lead);
                            }}
                            className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        title={formTitle}
        onClose={closeFormModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeFormModal}
              disabled={formSaving}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-form"
              disabled={formSaving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {formSaving ? 'Saving…' : formModal === 'create' ? 'Create' : 'Save changes'}
            </button>
          </>
        }
      >
        {formOpen ? (
          <LeadForm
            key={formKey}
            formId="lead-form"
            defaultValues={formDefaults}
            salespeople={salespeople}
            variant={formModal === 'create' ? 'create' : 'edit'}
            lockAssignee={isSales}
            assigneeId={user?.salespersonId || ''}
            onSubmit={handleLeadSubmit}
            submitting={formSaving}
            serverError={formError}
            onFieldChange={() => setFormError('')}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete lead"
        onClose={() => !deleteBusy && setDeleteTarget(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteBusy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteBusy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleteBusy ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete{' '}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.leadName}
          </span>
          ? This cannot be undone.
        </p>
        {deleteError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
