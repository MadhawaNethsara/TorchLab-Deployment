import { apiClient } from '../lib/apiClient';

/**
 * Downloads the leads PDF using the current auth token.
 * @param {Record<string, string | string[] | undefined>} params Query params: from, to, result, status, leadSource, salesperson, search
 */
export async function downloadLeadsReportPdf(params) {
  const response = await apiClient.get('/reports/leads.pdf', {
    params,
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'];
  let filename = 'leads-report.pdf';
  if (disposition && typeof disposition === 'string') {
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
    if (match) {
      filename = decodeURIComponent(match[1].replace(/"/g, '').trim());
    }
  }
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
