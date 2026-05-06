import { apiClient } from '../lib/apiClient';

export async function fetchDashboardStats() {
  const { data } = await apiClient.get('/dashboard');
  return data;
}
