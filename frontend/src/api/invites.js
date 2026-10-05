import client, { getCsrfCookie } from './client.js'

/** { company, department, expires_at, available, reason, message } */
export async function getInvite(code) {
  const { data } = await client.get(`/api/invites/${encodeURIComponent(code)}`)
  return data.data
}

/** Guests send account details; a logged-in employer without a profile sends nothing. */
export async function acceptInvite(code, values = {}) {
  await getCsrfCookie()
  const { data } = await client.post(`/api/invites/${encodeURIComponent(code)}/accept`, values)
  return data.data
}
