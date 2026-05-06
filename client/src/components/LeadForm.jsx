import { useState } from 'react';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export const LEAD_SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_email', label: 'Cold email' },
  { value: 'event', label: 'Event' },
];

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Won',
  'Lost',
];

const SOURCE_VALUES = new Set(LEAD_SOURCE_OPTIONS.map((o) => o.value));
const STATUS_VALUES = new Set(LEAD_STATUSES);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getDefaultLeadFormValues() {
  return {
    leadName: '',
    companyName: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'New',
    dealValue: '',
    salespersonId: '',
  };
}

/** Maps API lead document to form field names (phone, source). */
export function mapLeadToFormValues(lead) {
  if (!lead) return getDefaultLeadFormValues();
  return {
    leadName: lead.leadName ?? '',
    companyName: lead.companyName ?? '',
    email: lead.email ?? '',
    phone: lead.phoneNumber ?? '',
    source: lead.leadSource ?? 'website',
    status: lead.status ?? 'New',
    dealValue: lead.dealValue != null ? String(lead.dealValue) : '',
    salespersonId: lead.salesperson?._id ? String(lead.salesperson._id) : '',
  };
}

/**
 * Pure validation + API payload builder for lead forms.
 * @param {Record<string, string>} values
 * @param {{ variant?: 'create'|'edit', lockAssignee?: boolean, assigneeId?: string }} [options]
 */
export function validateLeadForm(values, options = {}) {
  const { variant = 'create', lockAssignee = false, assigneeId = '' } = options;
  const fieldErrors = {};

  const leadName = values.leadName?.trim() ?? '';
  if (!leadName) {
    fieldErrors.leadName = 'Lead name is required.';
  } else if (leadName.length > 200) {
    fieldErrors.leadName = 'Keep lead name under 200 characters.';
  }

  const companyName = values.companyName?.trim() ?? '';
  if (companyName.length > 200) {
    fieldErrors.companyName = 'Keep company name under 200 characters.';
  }

  const email = values.email?.trim() ?? '';
  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.email = 'Enter a valid email address.';
  } else if (email.length > 320) {
    fieldErrors.email = 'Email is too long.';
  }

  const phone = values.phone?.trim() ?? '';
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || phone.length > 40) {
      fieldErrors.phone = 'Enter a valid phone number.';
    }
  }

  const source = values.source;
  if (!source || !SOURCE_VALUES.has(source)) {
    fieldErrors.source = 'Select a valid source.';
  }

  const status = values.status;
  if (!status || !STATUS_VALUES.has(status)) {
    fieldErrors.status = 'Select a valid status.';
  }

  let salespersonPayload;
  if (lockAssignee && assigneeId) {
    const aid = String(assigneeId).trim();
    if (!OBJECT_ID_RE.test(aid)) {
      fieldErrors.salespersonId = 'Invalid account. Please sign out and sign in again.';
    }
    if (variant === 'edit') {
      salespersonPayload = undefined;
    } else {
      salespersonPayload = aid;
    }
  } else {
    const salespersonId = values.salespersonId?.trim() ?? '';
    if (salespersonId && !OBJECT_ID_RE.test(salespersonId)) {
      fieldErrors.salespersonId = 'Select a valid salesperson.';
    }
    salespersonPayload = salespersonId || null;
  }

  const dealRaw = values.dealValue;
  let dealValue;
  if (dealRaw === '' || dealRaw == null) {
    dealValue = undefined;
  } else {
    const n = Number(dealRaw);
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      fieldErrors.dealValue = 'Enter a valid number.';
    } else if (n < 0) {
      fieldErrors.dealValue = 'Deal value cannot be negative.';
    } else {
      dealValue = n;
    }
  }

  const payload = {
    leadName,
    ...(companyName ? { companyName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phoneNumber: phone } : {}),
    leadSource: source,
    status,
    ...(dealValue !== undefined ? { dealValue } : {}),
  };

  if (salespersonPayload !== undefined) {
    payload.salesperson = salespersonPayload;
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    payload,
  };
}

const inputClass = (hasError) =>
  [
    'mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20',
  ].join(' ');

/**
 * Reusable lead form for create and edit.
 * @param {object} props
 * @param {string} props.formId — id for external submit controls (`form="…"`).
 * @param {object} props.defaultValues — merged over defaults when modal opens.
 * @param {(payload: object) => void | Promise<void>} props.onSubmit — receives API-shaped body.
 * @param {boolean} [props.submitting]
 * @param {string} [props.serverError] — e.g. API message after failed save.
 * @param {() => void} [props.onFieldChange] — called when any field edits (clear parent server error).
 * @param {{ _id: string, name: string, email?: string }[]} [props.salespeople] — roster for assignment.
 * @param {'create'|'edit'} [props.variant]
 * @param {boolean} [props.lockAssignee] — sales rep: assignment fixed to self.
 * @param {string} [props.assigneeId] — salesperson id when locked.
 */
export function LeadForm({
  formId,
  defaultValues,
  onSubmit,
  submitting = false,
  serverError = '',
  onFieldChange,
  salespeople = [],
  variant = 'create',
  lockAssignee = false,
  assigneeId = '',
}) {
  const [values, setValues] = useState(() => ({
    ...getDefaultLeadFormValues(),
    ...defaultValues,
  }));
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    onFieldChange?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { ok, fieldErrors: nextErrors, payload } = validateLeadForm(values, {
      variant,
      lockAssignee,
      assigneeId,
    });
    setFieldErrors(nextErrors);
    if (!ok) return;
    await onSubmit(payload);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      {serverError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Lead name <span className="text-red-500">*</span>
          </label>
          <input
            name="leadName"
            value={values.leadName}
            onChange={(e) => updateField('leadName', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.leadName))}
            aria-invalid={fieldErrors.leadName ? 'true' : 'false'}
            aria-describedby={fieldErrors.leadName ? 'err-leadName' : undefined}
          />
          {fieldErrors.leadName ? (
            <p id="err-leadName" className="mt-1 text-xs text-red-600">
              {fieldErrors.leadName}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Company
          </label>
          <input
            name="companyName"
            value={values.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.companyName))}
            aria-invalid={fieldErrors.companyName ? 'true' : 'false'}
          />
          {fieldErrors.companyName ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.email))}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.phone))}
            aria-invalid={fieldErrors.phone ? 'true' : 'false'}
          />
          {fieldErrors.phone ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Source <span className="text-red-500">*</span>
          </label>
          <select
            name="source"
            value={values.source}
            onChange={(e) => updateField('source', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.source))}
            aria-invalid={fieldErrors.source ? 'true' : 'false'}
          >
            {LEAD_SOURCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {fieldErrors.source ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.source}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={values.status}
            onChange={(e) => updateField('status', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.status))}
            aria-invalid={fieldErrors.status ? 'true' : 'false'}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldErrors.status ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.status}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Assigned salesperson
          </span>
          {lockAssignee ? (
            <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
              You (new leads are assigned to your pipeline)
            </div>
          ) : (
            <>
              <label htmlFor="lead-salesperson" className="sr-only">
                Assigned salesperson
              </label>
              <select
                id="lead-salesperson"
                name="salespersonId"
                value={values.salespersonId}
                onChange={(e) => updateField('salespersonId', e.target.value)}
                disabled={submitting}
                className={inputClass(Boolean(fieldErrors.salespersonId))}
                aria-invalid={fieldErrors.salespersonId ? 'true' : 'false'}
              >
                <option value="">Unassigned</option>
                {salespeople.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name}
                    {sp.email ? ` (${sp.email})` : ''}
                  </option>
                ))}
              </select>
              {salespeople.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  No salespeople yet — add them under{' '}
                  <span className="font-medium text-slate-700">Sales team</span>.
                </p>
              ) : null}
            </>
          )}
          {fieldErrors.salespersonId ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.salespersonId}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Deal value
          </label>
          <input
            name="dealValue"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="0"
            value={values.dealValue}
            onChange={(e) => updateField('dealValue', e.target.value)}
            disabled={submitting}
            className={inputClass(Boolean(fieldErrors.dealValue))}
            aria-invalid={fieldErrors.dealValue ? 'true' : 'false'}
          />
          {fieldErrors.dealValue ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.dealValue}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
