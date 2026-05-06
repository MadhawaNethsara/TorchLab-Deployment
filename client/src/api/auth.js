import { apiClient } from '../lib/apiClient';

/** POST /api/auth/login — returns { token, user } */
export async function login(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.user;
}
