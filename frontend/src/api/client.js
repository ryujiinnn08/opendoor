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

// Call before login/register so Laravel sets the XSRF-TOKEN cookie.
export function getCsrfCookie() {
  return client.get('/sanctum/csrf-cookie')
}

let onUnauthorized = () => {}

// AuthContext registers a handler that clears the user when the session ends.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    // 419: the CSRF token expired (e.g., a form left open for hours). Refresh it and retry once.
    if (response?.status === 419 && config && !config._csrfRetried) {
      config._csrfRetried = true
      await getCsrfCookie()
      return client(config)
    }

    if (response?.status === 401) {
      onUnauthorized()
    }

    return Promise.reject(error)
  },
)

/**
 * Field errors from a Laravel 422/429 response as { field: 'first message' }.
 */
export function fieldErrorsFrom(error) {
  const errors = error?.response?.data?.errors
  if (!errors) return {}
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
}

/**
 * A message for errors that don't belong to one field (403, 500, network errors).
 */
export function generalErrorFrom(error) {
  if (!error?.response) return 'We could not reach OpenDoor. Check your internet connection and try again.'
  const { status, data } = error.response
  if (data?.errors) return null
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.'
  return data?.message || 'Something went wrong. Please try again.'
}

export default client
