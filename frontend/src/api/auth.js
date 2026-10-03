import client, { getCsrfCookie } from './client.js'

export async function register(values) {
  await getCsrfCookie()
  const { data } = await client.post('/api/register', values)
  return data.data
}

export async function login(values) {
  await getCsrfCookie()
  const { data } = await client.post('/api/login', values)
  return data.data
}

export async function logout() {
  await client.post('/api/logout')
}

export async function fetchCurrentUser() {
  const { data } = await client.get('/api/me')
  return data.data
}
