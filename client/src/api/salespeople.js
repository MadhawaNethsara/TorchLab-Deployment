import { apiClient } from '../lib/apiClient';

export async function fetchSalespeople() {
  const { data } = await apiClient.get('/salespeople');
  return data.salespeople;
}

export async function createSalesperson(body) {
  const { data } = await apiClient.post('/salespeople', body);
  return data.salesperson;
}
