import { apiClient } from '../lib/apiClient';

export async function fetchLeads(params) {
  const { data } = await apiClient.get('/leads', { params });
  return data.leads;
}

export async function fetchLead(id) {
  const { data } = await apiClient.get(`/leads/${id}`);
  return data.lead;
}

export async function addLeadNote(leadId, note) {
  const { data } = await apiClient.post(`/leads/${leadId}/notes`, note);
  return data.lead;
}

export async function createLead(body) {
  const { data } = await apiClient.post('/leads', body);
  return data.lead;
}

export async function updateLead(id, body) {
  const { data } = await apiClient.put(`/leads/${id}`, body);
  return data.lead;
}

export async function deleteLead(id) {
  await apiClient.delete(`/leads/${id}`);
}
