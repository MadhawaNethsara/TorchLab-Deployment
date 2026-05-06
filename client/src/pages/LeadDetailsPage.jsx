import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addLeadNote, fetchLead } from '../api/leads';

export function LeadDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLead(id)
      .then((data) => {
        if (!cancelled) setLead(data);
      })
      .catch(() => {
        if (!cancelled) setError('Lead not found or could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleAddNote(e) {
    e.preventDefault();
    setNoteError('');
    if (!noteContent.trim()) {
      setNoteError('Enter note content.');
      return;
    }
    setSavingNote(true);
    try {
      const updated = await addLeadNote(id, {
        content: noteContent.trim(),
        createdBy: user?.email || user?.id || 'unknown',
      });
      setLead(updated);
      setNoteContent('');
    } catch {
      setNoteError('Could not save note.');
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return <p className="text-slate-600">Loading lead…</p>;
  }

  if (error || !lead) {
    return (
      <div>
        <p className="text-red-600">{error || 'Lead not found.'}</p>
        <Link
          to="/leads"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
        >
          ← Back to leads
        </Link>
      </div>
    );
  }

  const notes = [...(lead.notes || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  function formatNoteDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  return (
    <div>
      <Link
        to="/leads"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        ← Leads
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        {lead.leadName}
      </h1>
      <p className="text-slate-600">{lead.companyName}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">Email</dt>
          <dd className="mt-1 text-slate-900">{lead.email || '—'}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">Phone</dt>
          <dd className="mt-1 text-slate-900">{lead.phoneNumber || '—'}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
          <dd className="mt-1 text-slate-900">{lead.status}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">Source</dt>
          <dd className="mt-1 text-slate-900">{lead.leadSource}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">
            Assigned
          </dt>
          <dd className="mt-1 text-slate-900">
            {lead.salesperson?.name || '—'}
          </dd>
          {lead.salesperson?.email ? (
            <dd className="mt-1 text-sm text-slate-600">{lead.salesperson.email}</dd>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase text-slate-500">
            Deal value
          </dt>
          <dd className="mt-1 text-slate-900">
            {lead.dealValue != null ? lead.dealValue : '—'}
          </dd>
        </div>
      </dl>

      <section
        className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm"
        aria-labelledby="notes-heading"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="notes-heading" className="text-lg font-semibold text-slate-900">
            Notes
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Log activity and context. Newest notes appear first.
          </p>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <form onSubmit={handleAddNote} className="space-y-3">
            <label htmlFor="new-note" className="sr-only">
              New note
            </label>
            <textarea
              id="new-note"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
              placeholder="Write a new note…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-invalid={noteError ? 'true' : 'false'}
              aria-describedby={noteError ? 'note-error' : undefined}
            />
            {noteError ? (
              <p id="note-error" className="text-sm text-red-600" role="alert">
                {noteError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Saved as{' '}
                <span className="font-medium text-slate-700">
                  {user?.email || user?.id || 'you'}
                </span>
              </p>
              <button
                type="submit"
                disabled={savingNote}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNote ? 'Adding…' : 'Add note'}
              </button>
            </div>
          </form>
        </div>

        <div className="px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            All notes ({notes.length})
          </h3>
          {notes.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 py-8 text-center text-sm text-slate-500">
              No notes yet. Add one above.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notes.map((note) => {
                const created = note.createdAt
                  ? new Date(note.createdAt).toISOString()
                  : '';
                return (
                  <li
                    key={note._id}
                    className="rounded-lg border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                      {note.content}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                      <div>
                        <dt className="font-medium text-slate-500">User</dt>
                        <dd className="mt-0.5 text-slate-800">
                          {note.createdBy || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">Created</dt>
                        <dd className="mt-0.5 tabular-nums text-slate-800">
                          {created ? (
                            <time dateTime={created}>
                              {formatNoteDate(note.createdAt)}
                            </time>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
