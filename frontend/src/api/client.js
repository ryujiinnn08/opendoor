import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// One shared Axios instance. Sanctum SPA auth uses the session cookie plus the
// XSRF-TOKEN cookie, so credentials must be sent on every request (plan D11).
const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

// Call once before login/register so Laravel sets the XSRF-TOKEN cookie.
export function getCsrfCookie() {
  return client.get('/sanctum/csrf-cookie')
}

export default client
